# rest-in-contract

(Unmaintained)

[![npm version](https://img.shields.io/npm/v/rest-in-contract.svg)](https://www.npmjs.com/package/rest-in-contract)
[![node](https://img.shields.io/node/v/rest-in-contract.svg)](https://www.npmjs.com/package/rest-in-contract)
[![Codecov branch](https://img.shields.io/codecov/c/github/airicyu/rest-in-contract/master.svg)](https://codecov.io/gh/airicyu/rest-in-contract)
[![Build](https://travis-ci.org/airicyu/rest-in-contract.svg?branch=master)](https://travis-ci.org/airicyu/rest-in-contract)

[![GitHub issues](https://img.shields.io/github/issues/airicyu/rest-in-contract.svg)](https://github.com/airicyu/rest-in-contract/issues)
[![GitHub forks](https://img.shields.io/github/forks/airicyu/rest-in-contract.svg)](https://github.com/airicyu/rest-in-contract/network)
[![GitHub stars](https://img.shields.io/github/stars/airicyu/rest-in-contract.svg)](https://github.com/airicyu/rest-in-contract/stargazers)
[![GitHub License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://raw.githubusercontent.com/airicyu/ahp/master/LICENSE)
[![dependencies Status](https://david-dm.org/airicyu/rest-in-contract/status.svg)](https://david-dm.org/airicyu/rest-in-contract)
[![devDependencies Status](https://david-dm.org/airicyu/rest-in-contract/dev-status.svg)](https://david-dm.org/airicyu/rest-in-contract?type=dev)

## Project Page

- Module Homepage: [http://blog.airic-yu.com/2064/rest-in-contract-nodejs-module-for-rest-api-contract-server](http://blog.airic-yu.com/2064/rest-in-contract-nodejs-module-for-rest-api-contract-server)
- Githup: [https://github.com/airicyu/rest-in-contract](https://github.com/airicyu/rest-in-contract)
- NPM: [https://www.npmjs.com/package/rest-in-contract](https://www.npmjs.com/package/rest-in-contract)
- Project rest-in-contract's Homepage: [http://blog.airic-yu.com/2062/project-rest-in-contract](http://blog.airic-yu.com/2062/project-rest-in-contract)

## Project Status

Currently, the project is in beta version (v0.x.x).
The basic Contract Server module is done to support basic usage of API Contract stubbing & testing, but we do not finalized the v1.0 in-the-box features yet.

## What is rest-in-contract

Rest-in-contract Project is a product to let you embrace **[Consumer-driven contracts](https://martinfowler.com/articles/consumerDrivenContracts.html)**. It is REST in nature so that it fits for integrating with all kind of programming languages.
For more detail about `Project rest-in-contract`, you may have a look in our [Project rest-in-contract's Homepage](http://blog.airic-yu.com/2062/project-rest-in-contracts) for detail introduction.

This `rest-in-contract` node module is a module for the Local Contract Server which is the core part of the Rest-in-contract project.

## Slideshare: Basic Concepts & Flows

[Rest in-contract basic concepts & flows](https://www.slideshare.net/EricYu28/rest-incontract-basic-concepts-flows-75659518)

------------------------

## Samples

### Hello world

Starting server:

```javascript
'use strict';

const contractServer = require('rest-in-contract');

contractServer.initRestServer({
    port: 8000
});
```

------------------------

## REST APIs

### Server

#### Operation: Import apps from files

- Endpoint: POST `http://localhost:8000/api/v1/importAppsFiles`
- Consume type: application/json
- Parameters:
  - appFolder: The root import folder

Request:

```
POST http://localhost:8000/api/v1/importAppsFiles
Content-type: application/json

{
    "port": 8001,
    "appFolder": "C:/apps_root_import_folder"
}
```

Response:

```
HTTP/1.1 201 Created
X-Powered-By: Express
Content-Type: text/html; charset=utf-8
Content-Length: 20
ETag: W/"14-CxkJk6y5nF+qfRAcolGoQusrIxI"
Date: Wed, 03 May 2017 15:02:25 GMT
Connection: keep-alive

importAppsFiles done
```

------------------------

### App

#### Operation: Create app

- Endpoint: POST `http://localhost:8000/api/v1/apps`
- Consume type: application/json
- Parameters:
  - name: App name
  - servers: Array of server domains
  - basePath: App base path

Request:

```
POST http://localhost:8000/api/v1/apps
Content-type: application/json

{
    "name": "test",
    "servers":["http://example.com:8001"],
    "basePath": "/api"
}
```

Response:

```
HTTP/1.1 201 Created
X-Powered-By: Express
location: /api/v1/apps/0fe5fd4e-55db-4a54-9dd5-29bec05f7793
Content-Type: text/html; charset=utf-8
Content-Length: 11
ETag: W/"b-5v+w5Q49RibYwAD6ONWrpN9Ksrw"
Date: Wed, 03 May 2017 15:04:11 GMT
Connection: keep-alive

App created
```

#### Operation: Get all apps

- Endpoint: GET `http://localhost:8000/api/v1/apps`
- Produce type: application/json

Request:

```
GET http://localhost:8000/api/v1/apps
```

Response:

```
HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 40
ETag: W/"28-MLp7j8JzNEp4q2Hd1FVH89/Z1xo"
Date: Wed, 03 May 2017 15:10:32 GMT
Connection: keep-alive

[
  "80a69a44-3f3b-48c1-a7d1-b34b89117e75"
]
```

#### Operation: Get app

- Endpoint: GET `http://localhost:8000/api/v1/apps/{{appId}}`
- Produce type: application/json+hal

Request:

```
GET http://localhost:8000/api/v1/apps/80a69a44-3f3b-48c1-a7d1-b34b89117e75
```

Response:

```
HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 302
ETag: W/"12e-P7wo1aI5bQW1OCNqpqj+RbfWkHU"
Date: Wed, 03 May 2017 16:54:13 GMT
Connection: keep-alive

{
  "_links": {
    "self": {
      "href": "/api/v1/apps/80a69a44-3f3b-48c1-a7d1-b34b89117e75"
    },
    "versions": {
      "href": "/api/v1/apps/80a69a44-3f3b-48c1-a7d1-b34b89117e75/versions"
    }
  },
  "id": "80a69a44-3f3b-48c1-a7d1-b34b89117e75",
  "name": "test",
  "servers": [
    "http://example.com:8001"
  ],
  "basePath": "/api",
  "versionNumbers": [
    "0.0.1"
  ]
}
```

#### Operation: Update app

- Endpoint: PUT `http://localhost:8000/api/v1/apps/{{appId}}`
- Consume type: application/json
- Parameters:
  - name: App name
  - servers: Array of server domains
  - basePath: App base path

Request:

```
PUT http://localhost:8000/api/v1/apps
Content-type: application/json

{
    "name": "test app",
    "servers":["http://example.com:8001"],
    "basePath": "/api"
}
```

Response:

```
HTTP/1.1 204 No Content
X-Powered-By: Express
ETag: W/"a-fKaPqGKTASLjiIDuRL5tqgGTwrc"
Date: Wed, 03 May 2017 16:04:03 GMT
Connection: keep-alive
```

#### Operation: Delete app

- Endpoint: DELETE `http://localhost:8000/api/v1/apps/{{appId}}`

Request:

```
DELETE http://localhost:8000/api/v1/apps/80a69a44-3f3b-48c1-a7d1-b34b89117e75
```

Response:

```
HTTP/1.1 204 No Content
X-Powered-By: Express
ETag: W/"a-fKaPqGKTASLjiIDuRL5tqgGTwrc"
Date: Wed, 03 May 2017 16:12:57 GMT
Connection: keep-alive
```

------------------------

### App Version

#### Operation: Create app version

- Endpoint: POST `http://localhost:8000/api/v1/apps/{{appId}}/versions`
- Consume type: application/json
- Parameters:
  - v: Version number
  - path: This version's API base path. Support template value {{app.basePath}} and {{version.v}}.
  - contracts: Array of contract IDs

Request:

```
POST http://localhost:8000/api/v1/apps/{{appId}}/versions
Content-type: application/json

{
  "v": "0.0.1",
  "path": "{{app.basePath}}/v{{version.v}}",
  "contracts": []
}
```

Response:

```
HTTP/1.1 201 Created
X-Powered-By: Express
location: /api/v1/apps/80a69a44-3f3b-48c1-a7d1-b34b89117e75/versions/0.0.1
Content-Type: text/html; charset=utf-8
Content-Length: 15
ETag: W/"f-tH+4uE5S7Qcsqwucu5EbWxuC4VI"
Date: Wed, 03 May 2017 16:33:14 GMT
Connection: keep-alive

Version created
```

#### Operation: Get all app versions

- Endpoint: GET `http://localhost:8000/api/v1/apps/{{appId}}/versions`
- Produce type: application/json

Request:

```
GET http://localhost:8000/api/v1/apps/80a69a44-3f3b-48c1-a7d1-b34b89117e75/versions
```

Response:

```
HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 9
ETag: W/"9-nGll1532et3zX/4JlTh6WNhVkvE"
Date: Wed, 03 May 2017 16:33:59 GMT
Connection: keep-alive

[
  "0.0.1"
]
```

#### Operation: Get app version

- Endpoint: GET `http://localhost:8000/api/v1/apps/{{appId}}/versions/{{versionNo}}`
- Produce type: application/json+hal

Request:

```
GET http://localhost:8000/api/v1/apps/80a69a44-3f3b-48c1-a7d1-b34b89117e75/versions/{{versionNo}}
```

Response:

```
HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 369
ETag: W/"171-QYWRbRhKCCoWzBunlwXi9xE2Rvs"
Date: Wed, 03 May 2017 16:54:42 GMT
Connection: keep-alive

{
  "_links": {
    "self": {
      "href": "/api/v1/apps/80a69a44-3f3b-48c1-a7d1-b34b89117e75/versions/0.0.1"
    },
    "parent": {
      "href": "/api/v1/apps/80a69a44-3f3b-48c1-a7d1-b34b89117e75"
    },
    "contracts": {
      "href": "/api/v1/apps/80a69a44-3f3b-48c1-a7d1-b34b89117e75/versions/0.0.1/contracts"
    }
  },
  "v": "0.0.1",
  "path": "{{app.basePath}}/v{{version.v}}",
  "contracts": [
    "94923fbd-9092-4a46-ad65-0d8a2e2f551e"
  ]
}
```

#### Operation: Update app version

- Endpoint: PUT `http://localhost:8000/api/v1/apps/{{appId}}/versions/{{versionNo}}`
- Consume type: application/json
- Parameters:
  - v: Version number
  - path: This version's API base path. Support template value {{app.basePath}} and {{version.v}}.
  - contracts: Array of contract IDs

Request:

```
Put http://localhost:8000/api/v1/apps/80a69a44-3f3b-48c1-a7d1-b34b89117e75/versions/0.0.1
Content-type: application/json

{
  "v": "0.0.1",
  "path": "{{app.basePath}}/v{{version.v}}",
  "contracts": [
    "{{contractId}}"
  ]
}
```

Response:

```
HTTP/1.1 204 No Content
X-Powered-By: Express
ETag: W/"a-fKaPqGKTASLjiIDuRL5tqgGTwrc"
Date: Wed, 03 May 2017 16:37:55 GMT
Connection: keep-alive
```

#### Operation: Delete app version

- Endpoint: DELETE `http://localhost:8000/api/v1/apps/{{appId}}/versions/{{versionNo}}`

Request:

```
DELETE http://localhost:8000/api/v1/apps/80a69a44-3f3b-48c1-a7d1-b34b89117e75/versions/0.0.1
```

Response:

```
HTTP/1.1 204 No Content
X-Powered-By: Express
ETag: W/"a-fKaPqGKTASLjiIDuRL5tqgGTwrc"
Date: Wed, 03 May 2017 16:39:47 GMT
Connection: keep-alive
```

------------------------

### Contract

#### Operation: Create contract

- Endpoint: POST `http://localhost:8000/api/v1/contracts`
- Consume type: application/vnd.js.contract

Request:

```
POST http://localhost:8000/api/v1/contracts
Content-type: application/vnd.js.contract

var dsl = require('rest-in-contract-dsl');
var { value, stub, test, regex, integer } = dsl.functions;

module.exports =
{
  "name": "testing for hello contract",
    "request": {
        "method": "POST",
        "urlPath": value({stub: regex("/hello/[a-z]*"), test: "/hello/apple"}),
        "queryParameters": [{
            "name": "a", "value": "b"
        }],
        "body": {
            "test": {
                "a": value({stub: regex("[0-9]*"), test: "13579"}),
                "b": value({stub: integer({gt:0, lt:60000}), test: 24680}),
                "c": ["apple", "orange", "banana"]
            }
        },
        "headers": {
        }
    },
    "response": {
        "status": 200,
        "headers": {
            "test-header": "dummy",
            "test-regex-header": regex("\"/hello/[a-z]{3,5}\"")
        },
        "body": {
            "num" : value({stub: 56789, test: integer({gt:0, lt:60000})}),
        }
    }
}
```

Response:

```
HTTP/1.1 201 Created
X-Powered-By: Express
location: /api/v1/contracts/570c74ee-5387-4909-b2a3-a95422aaee33
Content-Type: text/html; charset=utf-8
Content-Length: 16
ETag: W/"10-v1NpEZIXw5kKR7auVtqbRzfaKfc"
Date: Wed, 03 May 2017 16:41:29 GMT
Connection: keep-alive

Contract created
```

#### Operation: Get all contracts

- Endpoint: GET `http://localhost:8000/api/v1/contracts`
- Produce type: application/json

Request:

```
GET http://localhost:8000/api/v1/contracts
```

Response:

```
HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 40
ETag: W/"28-pFFV3w2VD+jdlJaQB7abviZPy9A"
Date: Wed, 03 May 2017 16:42:09 GMT
Connection: keep-alive

[
  "94923fbd-9092-4a46-ad65-0d8a2e2f551e"
]
```

#### Operation: Get contract

- Endpoint: GET `http://localhost:8000/api/v1/contracts/{{contractId}}`
- Produce type: application/vnd.js.contract or application/json

For produce type `application/vnd.js.contract`,

Request:

```
GET http://localhost:8000/api/v1/apps/94923fbd-9092-4a46-ad65-0d8a2e2f551e
Accept: application/vnd.js.contract
```

Response:

```
HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: application/vnd.js.contract; charset=utf-8
Content-Length: 950
ETag: W/"3b6-dpq2nJH45MeXLrr9vhhtVubL4fY"
Date: Wed, 03 May 2017 16:56:50 GMT
Connection: keep-alive

var dsl = require('rest-in-contract-dsl');
var { value, stub, test, regex, integer } = dsl.functions;

module.exports = {
  "id": "94923fbd-9092-4a46-ad65-0d8a2e2f551e",
  "name": "testing for hello contract",
  "request": {
    "method": "POST",
    "urlPath": value({
      stub: regex("/hello/[a-z]*"),
      test: "/hello/apple"
    }),
    "queryParameters": [{
      "name": "a",
      "value": "b"
    }],
    "body": {
      "test": {
        "a": value({
          stub: regex("[0-9]*"),
          test: "13579"
        }),
        "b": value({
          stub: integer({
            "gt": 0,
            "lt": 60000
          }),
          test: 24680
        }),
        "c": ["apple", "orange", "banana"]
      }
    },
    "headers": {}
  },
  "response": {
    "status": 200,
    "body": {
      "num": value({
        stub: 56789,
        test: integer({
          "gt": 0,
          "lt": 60000
        })
      })
    },
    "headers": {
      "test-header": "dummy",
      "test-regex-header": regex("\"/hello/[a-z]{3,5}\"")
    }
  }
}
```

For produce type `application/json`,

Request:

```
GET http://localhost:8000/api/v1/apps/94923fbd-9092-4a46-ad65-0d8a2e2f551e
Accept: application/json
```

Response:

```
HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 917
ETag: W/"395-V12dp+S/ZB7zDYRQhQIkEvKH42c"
Date: Wed, 03 May 2017 16:57:23 GMT
Connection: keep-alive

{
  "_links": {
    "self": {
      "href": "/api/v1/contracts/94923fbd-9092-4a46-ad65-0d8a2e2f551e"
    }
  },
  "id": "94923fbd-9092-4a46-ad65-0d8a2e2f551e",
  "name": "testing for hello contract",
  "contractScript": "var dsl = require('rest-in-contract-dsl');\nvar dsl = require('rest-in-contract-dsl');\nvar {\n  value,\n  stub,\n  test,\n  regex,\n  integer\n} = dsl.functions;\n\nmodule.exports = { \"id\": \"94923fbd-9092-4a46-ad65-0d8a2e2f551e\", \"name\": \"testing for hello contract\", \"request\": { \"method\": \"POST\", \"urlPath\": value({stub: regex(\"/hello/[a-z]*\"), test: \"/hello/apple\" }), \"queryParameters\": [{\"name\":\"a\",\"value\":\"b\"}], \"body\": { \"test\": { \"a\": value({stub: regex(\"[0-9]*\"), test: \"13579\" }), \"b\": value({stub: integer({\"gt\":0,\"lt\":60000}), test: 24680 }), \"c\": [\"apple\",\"orange\",\"banana\"] } }, \"headers\": {  } }, \"response\": { \"status\": 200, \"body\": { \"num\": value({stub: 56789, test: integer({\"gt\":0,\"lt\":60000}) }) }, \"headers\": { \"test-header\": \"dummy\", \"test-regex-header\": regex(\"\\\"/hello/[a-z]{3,5}\\\"\") } } }"
}
```

#### Operation: Delete contract

- Endpoint: DELETE `http://localhost:8000/api/v1/contracts/{{contractId}}`

Request:

```
DELETE http://localhost:8000/api/v1/contracts/94923fbd-9092-4a46-ad65-0d8a2e2f551e
```

Response:

```
HTTP/1.1 204 No Content
X-Powered-By: Express
ETag: W/"a-fKaPqGKTASLjiIDuRL5tqgGTwrc"
Date: Wed, 03 May 2017 16:58:32 GMT
Connection: keep-alive
```

------------------------

### App Wirestub

#### Operation: Create app wirestub

- Endpoint: POST `http://localhost:8000/api/v1/apps/{{appId}}/wirestubs`
- Consume type: application/json
- Parameters:
  - port: stub server port

Request:

```
POST http://localhost:8000/api/v1/apps/80a69a44-3f3b-48c1-a7d1-b34b89117e75/wirestubs
Content-type: application/json

{
    "port": 8001
}
```

Response:

```
HTTP/1.1 201 Created
X-Powered-By: Express
location: http://localhost:8001
Content-Type: text/html; charset=utf-8
Content-Length: 16
ETag: W/"10-fIzoxmT7PBtS3VenRVFrOiVZIGk"
Date: Wed, 03 May 2017 17:00:59 GMT
Connection: keep-alive

Wirestub created
```

#### Operation: Get app wirestub

- Endpoint: GET `http://localhost:8000/api/v1/apps/{{appId}}/wirestubs`
- Produce type: application/json

Request:

```
GET http://localhost:8000/api/v1/apps/80a69a44-3f3b-48c1-a7d1-b34b89117e75/wirestubs
```

Response:

```
HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 13
ETag: W/"d-zKi4UZmQrcIHY3Y7nrLnH5dxte0"
Date: Wed, 03 May 2017 17:03:05 GMT
Connection: keep-alive

{
  "port": 8001
}
```

#### Operation: Delete app wirestub

- Endpoint: DELETE `http://localhost:8000/api/v1/apps/{{appId}}/wirestubs`

Request:

```
DELETE http://localhost:8000/api/v1/apps/80a69a44-3f3b-48c1-a7d1-b34b89117e75/wirestubs
```

Response:

```
HTTP/1.1 204 No Content
X-Powered-By: Express
ETag: W/"10-Gk3HW1jO8GmUH/09/yQs20dUTAc"
Date: Wed, 03 May 2017 17:05:07 GMT
Connection: keep-alive
```

------------------------

### App Wiretest

#### Operation: Create app wiretest

- Endpoint: POST `http://localhost:8000/api/v1/apps/{{appId}}/wiretests`
- Consume type: application/json
- Parameters:
  - server: The server which targeted for testing

Request:

```
POST http://localhost:8000/api/v1/apps/80a69a44-3f3b-48c1-a7d1-b34b89117e75/wiretests
Content-type: application/json

{
    "server": "http://localhost:8001"
}
```

Response:

```
HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 2990
ETag: W/"410-60OQ8mFitlhnCKmy5Ej8e5MfpvA"
Date: Wed, 03 May 2017 17:07:55 GMT
Connection: keep-alive

{
  "app": {
    "id": "80a69a44-3f3b-48c1-a7d1-b34b89117e75",
    "name": "test"
  },
  "testInfo": {
    "timeMS": 18.979278922080994,
    "success": true
  },
  "results": [
    {
      "versionNo": "0.0.1",
      "testInfo": {
        "timeMS": 18.92987608909607,
        "success": true
      },
      "results": [
        {
          "testInfo": {
            "timeMS": 7.522804021835327,
            "success": true,
            "errors": [],
            "appId": "80a69a44-3f3b-48c1-a7d1-b34b89117e75",
            "version": "0.0.1",
            "contract": {
              "id": "5ce2be34-0aff-4b09-ae89-014e479ec072",
              "name": "echo contract"
            },
            "expectedResponseScript": "{ \"status\": 200, \"body\": evalContext(function (context) {\n                return context.req.rawBody;\n            }), \"headers\": {  } }"
          },
          "requestResults": [
            {
              "testInfo": {
                "timeMS": 3.5169509649276733,
                "success": true,
                "errors": [],
                "requestMethod": "GET"
              },
              "request": {
                "method": "GET",
                "urlPath": "http://localhost:8001/api/v0.0.1/echo",
                "queryParams": {},
                "headers": {},
                "body": ""
              },
              "response": {
                "status": 200,
                "headers": {
                  "x-powered-by": "Express",
                  "content-type": "text/html; charset=utf-8",
                  "content-length": "0",
                  "etag": "W/\"0-2jmj7l5rSw0yVb/vlWAYkK/YBwk\"",
                  "date": "Tue, 01 May 2018 12:20:37 GMT",
                  "connection": "close"
                },
                "body": ""
              }
            },
            {
              "testInfo": {
                "timeMS": 2.969341993331909,
                "success": true,
                "errors": [],
                "requestMethod": "POST"
              },
              "request": {
                "method": "POST",
                "urlPath": "http://localhost:8001/api/v0.0.1/echo",
                "queryParams": {},
                "headers": {},
                "body": ""
              },
              "response": {
                "status": 200,
                "headers": {
                  "x-powered-by": "Express",
                  "content-type": "text/html; charset=utf-8",
                  "content-length": "0",
                  "etag": "W/\"0-2jmj7l5rSw0yVb/vlWAYkK/YBwk\"",
                  "date": "Tue, 01 May 2018 12:20:37 GMT",
                  "connection": "close"
                },
                "body": ""
              }
            }
          ]
        },
        {
          "testInfo": {
            "timeMS": 5.73561704158783,
            "success": true,
            "errors": [],
            "appId": "80a69a44-3f3b-48c1-a7d1-b34b89117e75",
            "version": "0.0.1",
            "contract": {
              "id": "b9135ab0-20d2-43f3-b947-3bac5b061f61",
              "name": "function examples"
            },
            "expectedResponseScript": "{ \"status\": 200, \"body\": { \"num\": value({ \"stub\": 56789, \"test\": integer({\"gt\":0,\"lt\":60000}) }), \"reqBodyJsonParams\": jsonpath(\"$.req.jsonBody.test\"), \"test1\": sum(1, jsonpath(\"$.req.jsonBody.test.number\")), \"evalContext\": evalContext(function (context){\n\t\t\t\treturn context.req.body.test.number + 2;\n\t\t\t}) }, \"headers\": { \"test-header\": \"dummy\", \"test-regex-header\": regex(\"\\\"/hello/[a-z]{3,5}\\\"\") } }"
          },
          "requestResults": [
            {
              "testInfo": {
                "timeMS": 5.26628303527832,
                "success": true,
                "errors": [],
                "requestMethod": "POST"
              },
              "request": {
                "method": "POST",
                "urlPath": "http://localhost:8001/api/v0.0.1/function_examples",
                "queryParams": {},
                "headers": {
                  "authorization": "Bearer 0a4b6c5d",
                  "Content-type": "application/json"
                },
                "body": {
                  "test": {
                    "numberString": "13579",
                    "number": 24680,
                    "arrayOfValues": [
                      "apple",
                      "orange",
                      "banana"
                    ],
                    "regular expression": "acp-113520",
                    "name": "Cristina Hayes",
                    "email": "Cristina.Hayes82@yahoo.com",
                    "phone": "1-454-765-8135",
                    "date": "2017-05-07",
                    "words": "reiciendis est minima",
                    "uuid4": "510552bc-c017-452a-bd51-7b1b3d3a5f13",
                    "multipleChoices": "class A",
                    "notAnyOf": "c"
                  }
                }
              },
              "response": {
                "status": 200,
                "headers": {
                  "x-powered-by": "Express",
                  "test-header": "dummy",
                  "test-regex-header": "\"/hello/cgwds\"",
                  "content-type": "application/json; charset=utf-8",
                  "content-length": "413",
                  "etag": "W/\"19d-Tzo0I7hapc6pvdXBfQWWcgrdcos\"",
                  "date": "Tue, 01 May 2018 12:20:37 GMT",
                  "connection": "close"
                },
                "body": "{\"num\":56789,\"reqBodyJsonParams\":{\"numberString\":\"13579\",\"number\":24680,\"arrayOfValues\":[\"apple\",\"orange\",\"banana\"],\"regular expression\":\"acp-113520\",\"name\":\"Cristina Hayes\",\"email\":\"Cristina.Hayes82@yahoo.com\",\"phone\":\"1-454-765-8135\",\"date\":\"2017-05-07\",\"words\":\"reiciendis est minima\",\"uuid4\":\"510552bc-c017-452a-bd51-7b1b3d3a5f13\",\"multipleChoices\":\"class A\",\"notAnyOf\":\"c\"},\"test1\":24681,\"evalContext\":24682}"
              }
            }
          ]
        },
        {
          "testInfo": {
            "timeMS": 5.237089991569519,
            "success": true,
            "errors": [],
            "appId": "80a69a44-3f3b-48c1-a7d1-b34b89117e75",
            "version": "0.0.1",
            "contract": {
              "id": "94923fbd-9092-4a46-ad65-0d8a2e2f551e",
              "name": "testing for hello contract"
            },
            "expectedResponseScript": "{ \"status\": 200, \"body\": { \"num\": value({ \"stub\": 56789, \"test\": integer({\"gt\":0,\"lt\":60000}) }) }, \"headers\": { \"test-header\": \"dummy\", \"test-regex-header\": regex(\"\\\"/hello/[a-z]{3,5}\\\"\"), \"test-regex-header2\": regex(\"/world/[a-z]{3,5}\") } }"
          },
          "requestResults": [
            {
              "testInfo": {
                "timeMS": 4.786684989929199,
                "success": true,
                "errors": [],
                "requestMethod": "POST"
              },
              "request": {
                "method": "POST",
                "urlPath": "http://localhost:8001/api/v0.0.1/hello/apple",
                "queryParams": {
                  "a": "b"
                },
                "headers": {
                  "Content-type": "application/json"
                },
                "body": {
                  "test": {
                    "a": "13579",
                    "b": 24680,
                    "c": [
                      "apple",
                      "orange",
                      "banana"
                    ]
                  }
                }
              },
              "response": {
                "status": 200,
                "headers": {
                  "x-powered-by": "Express",
                  "test-header": "dummy",
                  "test-regex-header": "\"/hello/ztms\"",
                  "test-regex-header2": "/world/zla",
                  "content-type": "application/json; charset=utf-8",
                  "content-length": "13",
                  "etag": "W/\"d-X7zzcBORmHVzBfO4n/4UzEkpfkY\"",
                  "date": "Tue, 01 May 2018 12:20:37 GMT",
                  "connection": "close"
                },
                "body": "{\"num\":56789}"
              }
            }
          ]
        }
      ]
    }
  ]
}
```

------------------------

SDK API

(To be update)
