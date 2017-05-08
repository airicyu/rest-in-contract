module.exports = 
{
	"id": "b9135ab0-20d2-43f3-b947-3bac5b061f61",
	"name": "function examples",
    "request": {
        "method": "POST",
        "urlPath": "/function_examples",
        "body": {
            "test": {
                "numberString": value({stub: regex("[0-9]*"), test: "13579"}),
                "number": value({stub: integer({gt:0, lt:60000}), test: 24680}),
                "arrayOfValues": ["apple", "orange", "banana"],
				"regular expression": value({stub: regex("[a-z]{1,3}-[0-9]{6}"), test: "acp-113520"}),
				"name": value({stub: name(), test: "Cristina Hayes"}),
				"email": value({stub: email(), test: "Cristina.Hayes82@yahoo.com"}),
				"phone": value({stub: phone(), test: "1-454-765-8135"}),
				"date": value({stub: date({format: "YYYY-MM-DD"}), test: "2017-05-07"}),
				"words": value({stub: text({type: "words"}), test: "reiciendis est minima"}),
				"uuid4": value({stub: uuid4(), test: "510552bc-c017-452a-bd51-7b1b3d3a5f13"}),
				"multipleChoices": value({stub: anyOf("class A", "class B"), test: "class A"}),
				"notAnyOf": value({stub: notAnyOf("a", "b"), test: "c"}),
            }
        },
        "headers": {
			"authorization": value({stub: regex("Bearer [0-9a-zA-Z]+"), test: "Bearer 0a4b6c5d"})
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
			"reqBodyJsonParams" : jsonpath("$.req.body.test")
        }
    }
}