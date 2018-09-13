const MongoClient = require('mongodb').MongoClient;
const csv = require('csvtojson');
const { promisify } = require('util');
const AWS = require('aws-sdk');
const s3 = new AWS.S3();// Configuring the SDK
AWS.config.update({accessKeyId: process.env.keyid, secretAccessKey: process.env.keyid});
const sqs = new AWS.SQS({region:'us-east-1'}); 


/**
 * 
 * @param {*} bucketName 
 * @param {*} bucketKey 
 */
async function getObject(bucketName, bucketKey) {
  return new Promise((resolve, reject) => {
    s3.getObject({
      Bucket: bucketName,
      Key: bucketKey
    }, (error, res) => error ? reject(error) : resolve(res))
  })
}

/**
 * 
 * @param {*} CSVconversion 
 */
function CSVtoJson(CSVconversion){
  let CSVjson = [];
  for (let j = 1; j < CSVconversion.length; j++) {
    let [to] = CSVconversion[j];
    let toSplit = to.split(";");
    CSVjson.push({
      "cpf": toSplit[0],
      "nmrBeneficio": toSplit[1],
      "nome": toSplit[2],
      "dtNascimento": toSplit[3],
      "status": "Pending"
    });
  }
  return CSVjson;
}


/**
 * 
 * @param {*} CSVjson 
 */
async function insert(CSVjson) {
  const connection = await MongoClient.connect(
    'mongodb://danilopelozone:danilo123@ds247852.mlab.com:47852/testecsv', { useNewUrlParser: true }
  );
  const collection = connection.db('testecsv').collection('csv');
  console.log("conectado");
  CSVjson.map(async (item) => {
    const { cpf, nmrBeneficio, nome, dtNascimento, status } = item;
    await collection.insert({
      cpf: cpf,
      nmrBeneficio: nmrBeneficio,
      nome: nome,
      dtNascimento: dtNascimento,
      status: status
    });
  });
  return;
}


/**
 * 
 * @param {*} params 
 */
function createQueueAsync(params) {
  return new Promise((resolve, reject) => {
    sqs.createQueue({
      QueueName: 'S3_AWS_SLS_SQS',
      Attributes: {
        'DelaySeconds': '60',
        'MessageRetentionPeriod': '86400'
      }
    }, (error, res) => error ? reject(error) : resolve(res))
  })
}


/**
 * 
 * @param {*} params 
 */
function sendMessageAsync(params) {
  return new Promise((resolve, reject) => {
    sqs.sendMessage(params, (error, res) => error ? reject(error) : resolve(res))
  })
}


/**
 * 
 * @param {*} CSVjson 
 */
async function CSVProcess(CSVjson) {
  console.log('Chegou na criação da queue');
  const createdQueue = await createQueueAsync();
      const params = {
        DelaySeconds: 10,
        MessageAttributes: {
          "data": {
            DataType: "String",
            StringValue: JSON.stringify(CSVjson)
          }
        },
        MessageBody: "Mapped CSV",
        QueueUrl: createdQueue.QueueUrl
        };
        console.log('Enviando Mensagem 10');
        const SQSvalidation = await sendMessageAsync(params);
        console.log("mensagem enviada")
        if (SQSvalidation){
          return {
          statusCode: 200,
          body: JSON.stringify({
            message: 'mensagem enviada'
            }),
          };
        }
        else {
          return {
            statusCode: 400,
            body: JSON.stringify({
              message: 'mensagem não enviada'
              }),
            }; 
        }
  };


/**
 * 
 * @param {*} event 
 * @param {*} context 
 */
module.exports.csvReader = async (event, context) => {
  
  console.log('EVENTO RECEBIDO', JSON.stringify(event));
  
  const bucketName = event.Records[0].s3.bucket.name
  const bucketKey = event.Records[0].s3.object.key
  const CSValues = await getObject(bucketName, bucketKey)
  console.log("object *****", CSValues)
  console.log("object ", CSValues.Body.toString())
  
  const CSValuesString = CSValues.Body.toString()
  console.log(JSON.stringify(CSValuesString))
  
  const CSVconversion = await csv({
    noheader: true,
    output: "csv"
  })
    .fromString(CSValuesString);
  console.log("valor do resultado: ", CSVconversion);

  const CSVjson = CSVtoJson(CSVconversion)
  console.log(JSON.stringify(CSVjson));
  
  //await insert(CSVjson);

  return await CSVProcess(CSVjson);
};

