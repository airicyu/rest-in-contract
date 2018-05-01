var dsl = require('rest-in-contract-dsl');
var { value, stub, test, regex, integer, evalContext } = dsl.functions;

module.exports =
    {
        "id": "5ce2be34-0aff-4b09-ae89-014e479ec072",
        "name": "echo contract",
        "request": {
            "method": ["GET", "POST"],
            "urlPath": "/echo"
        },
        "response": {
            "status": 200,
            "body": evalContext(function (context) {
                return context.req.rawBody;
            })
        }
    }