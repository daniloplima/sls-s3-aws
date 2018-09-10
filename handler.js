'use strict';
var MongoClient = require('mongodb').MongoClient;
const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const { promisify } = require('util')
/*const getObject = (bucketName, bucketKey) => {
  return new Promise((resolve, reject) => {
    s3.getObject({
      Bucket: bucketName,
      Key: bucketKey
    }, (error, res) => error ? reject(error) : resolve(res))
  })
}
*/

const getObjectAsync = promisify(s3.getObject);
const copyObjectAsync = promisify(s3.copyObject);


const insert = async (event, context) => {
  try {
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
    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.log('error', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Erro interno do servidor',
        input: event,
      }),
    };
  };
}

module.exports.hello = async (event, context) => {
  console.log('EVENTO RECEBIDO', JSON.stringify(event));
  const bucketName = event.Records[0].s3.bucket.name
  const bucketKey = event.Records[0].s3.object.key
  const BucketChange = {
    CopySource: `bucketName/bucketKey`,
    Bucket: "testedanilocopy",
    Key: event.Records[0].s3.object.key,
  };

  /*
  return new Promise((resolve, reject) => {
    s3.copyObject({
      CopySource: `bucketName/bucketKey`,
      Bucket: "testedanilocopy",
      Key: event.Records[0].s3.object.key,
    }, (err, rst) => {
      if (err) {
        return reject(err)
      }
      console.log(CopySource);
      console.log(Bucket);
      console.log(Key);
      const object = rst
      console.log("object ", object.Body.toString())
      return resolve({
        statusCode: 200,
        body: JSON.stringify({
          message: 'Go Serverless v1.0! Your function executed successfully!',
          input: event,
        }),
      });
    })
  })
  */

  return new Promise((resolve, reject) => {
    s3.getObject({
      Bucket: bucketName,
      Key: bucketKey
    }, (error, res) => {
      if (error) {
        return reject(error)
      }
      const object = res
      console.log("object *****", object)
      console.log("object ", object.Body.toString())
      return resolve({
        statusCode: 200,
        body: JSON.stringify({
          message: 'Go Serverless v1.0! Your function executed successfully!',
          input: event,
        }),
      });
    })
  })
};

insert(object);