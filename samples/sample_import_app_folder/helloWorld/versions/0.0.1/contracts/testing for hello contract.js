module.exports = 
{
	"id": "94923fbd-9092-4a46-ad65-0d8a2e2f551e",
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