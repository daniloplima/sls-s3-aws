var MongoClient = require('mongodb').MongoClient;
const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const csv = require('csvtojson');
AWS.config.update({ region: 'us-east-1' });



//Stores all of the registers in the csv file
const insert = async (json) => {
  const connection = await MongoClient.connect(
    'mongodb://danilopelozone:danilo123@ds247852.mlab.com:47852/testecsv', { useNewUrlParser: true }
  );
  const collection = connection.db('testecsv').collection('csv');
  console.log("conectado");
  json.map(async (item) => {
    const { cpf, nmrBeneficio, nome, dtNascimento } = item;
    await collection.insert({
      cpf: cpf,
      nmrBeneficio: nmrBeneficio,
      nome: nome,
      dtNascimento: dtNascimento,
      status: "Pending"
    });
    await notify();
  });
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Inserido com sucesso',
    }),
  };
}


const getObject = (bucketName, bucketKey) => {
  return new Promise((resolve, reject) => {
    s3.getObject({
      Bucket: bucketName,
      Key: bucketKey
    }, (error, res) => error ? reject(error) : resolve(res))
  })
}

const notify = async () => {
  // Create publish parameters
  var params = {
    Message: 'test', /* required */
    TopicArn: 'arn:aws:sns:us-east-1:102671261511:S3_AWS_SLS_SNS_2'
  };

  // Create promise and SNS service object
  var sns = new AWS.SNS();
  console.log('sending push');
  sns.publish({
    Message: params.Message,
    MessageStructure: 'json',
    TargetArn: params.TopicArn
  }, function (err, data) {
    if (err) {
      console.log(err.stack);
      return;
    }

    console.log('push sent');
    console.log(data);
  });

}

module.exports.hello = async (event, context) => {
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
      "dtNascimento": toSplit[3]
    });
  }
  //console.log(JSON.stringify(json));
  await insert(json);
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Sucesso'
    }),
  };
};

