var MongoClient = require('mongodb').MongoClient;
const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const { promisify } = require('util')

const getObjectAsync = promisify(s3.getObject);
const copyObjectAsync = promisify(s3.copyObject);

const insert = async (dados) => {

  const connection = await MongoClient.connect(
    'mongodb://danilopelozone:danilo123@ds247852.mlab.com:47852/testecsv',
  );
  const collection = connection.db('testecsv').collection('csv');
  console.log("conectado");
  const { cpf, nmrBeneficio, nome, dtNascimento } = JSON.parse(object.body);

  const result = await collection.insert({
    cpf,
    nmrBeneficio,
    nome,
    dtNascimento
  });
  return result

}

module.exports.hello = async (event, context) => {
  console.log('EVENTO RECEBIDO', JSON.stringify(event));
  /*  const bucketName = event.Records[0].s3.bucket.name
    const bucketKey = event.Records[0].s3.object.key
    const CSValues = await getObjectAsync({ bucketName, bucketKey })
    console.log("object *****", CSValues)
    console.log("object ", CSValues.Body.toString())
    */
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'clkdsnljdsipk',
      input: event,
    }),
  };
};