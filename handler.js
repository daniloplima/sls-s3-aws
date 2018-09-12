const MongoClient = require('mongodb').MongoClient;
const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const csv = require('csvtojson');
const { promisify } = require('util');
// Create promise and SNS service object
const sns = new AWS.SNS();
AWS.config.update({
  accessKeyId : 'login',
  secretAccessKey : 'senha'
});
AWS.config.update({ region: 'us-east-1' });
const publishPromise = () =>{
  sns.publish({
  Message: 'test',
  MessageStructure: 'json',
  TargetArn: 'arn:aws:sns:us-east-1:135152123371:S3_AWS_SLS_SNS'
  }).promise()
};


/*const notify = () => sns.publish({
  Message: 'test',
  MessageStructure: 'json',
  TargetArn: 'arn:aws:sns:us-east-1:135152123371:S3_AWS_SLS_SNS'
}).promise();*/

//Stores all of the registers in the csv file
async function insert(json) {
  const connection = await MongoClient.connect(
    'mongodb://danilopelozone:danilo123@ds247852.mlab.com:47852/testecsv', { useNewUrlParser: true }
  );
  const collection = connection.db('testecsv').collection('csv');
  console.log("conectado");
  json.map(async (item) => {
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

async function getObject(bucketName, bucketKey) {
  return new Promise((resolve, reject) => {
    s3.getObject({
      Bucket: bucketName,
      Key: bucketKey
    }, (error, res) => error ? reject(error) : resolve(res))
  })
}

module.exports.csvReader = async (event, context) => {
  //console.log('EVENTO RECEBIDO', JSON.stringify(event));
  const bucketName = event.Records[0].s3.bucket.name
  const bucketKey = event.Records[0].s3.object.key
  const CSValues = await getObject(bucketName, bucketKey)
  //console.log("object *****", CSValues)
  //console.log("object ", CSValues.Body.toString())
  const CSValuesString = CSValues.Body.toString()
  //console.log(JSON.stringify(CSValuesString))
  const resultado = await csv({
    noheader: true,
    output: "csv"
  })
    .fromString(CSValuesString);
  //console.log("valor do resultado: ", resultado);

  var json = [];
  for (let j = 1; j < resultado.length; j++) {
    let [to] = resultado[j];
    let toSplit = to.split(";");
    json.push({
      "cpf": toSplit[0],
      "nmrBeneficio": toSplit[1],
      "nome": toSplit[2],
      "dtNascimento": toSplit[3],
      "status": "Pending"
    });
  }
  console.log(JSON.stringify(json));
  await insert(json);
  publishPromise()
  .then((response) => {
    console.log('Message published');
  }, (err) => {
    console.log('We had an error');
  });
  //console.log(responseSNS);
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Sucesso'
    }),
  };
};

