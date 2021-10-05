before(function () {
    // example.json is our test data for our spec/class file
    cy.fixture('test_data').then(function (data) {
        this.data = data
    })
})

describe('VerifyErrorMessagesForInvalidDate', function () {

    it('VerifyErrorMessagesForInvalidStartDate', function () {
        cy.wait(20000)
        cy.request({
            method: 'POST',
            url: 'https://intermx-test.apigee.net/v1/contracts/billing-exports/search?perPage=1',
            failOnStatusCode: false,

            body: {
                "filter": {
                    "startDate": "01/01/20",
                    "endDate": "01/01/2021"
                }
            },

            headers: {
                "content-type": "application/json",
                "apikey": "r7FWO2c1BnvUbL9DyFYCwS6wxxuqRiO3",
                'Authorization': this.data.Bearer,
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                "origin": "https://staging.oneomg.io"
            }
        }).then((res) => {

            expect(res.headers).to.include({

                'content-type': 'application/json; charset=utf-8'
                //  'origin':'https://staging.oneomg.io'
            })
            cy.wait(3000)
            expect(res.status).equal(400)
            expect(res.body).has.property('api-message', 'Start Date should be valid format(MM/DD/YYYY)')
            
        })
    })

    
    it('VerifyErrorMessagesForInvalidEndDate', function () {

        cy.request({
            method: 'POST',
            url: 'https://intermx-test.apigee.net/v1/contracts/billing-exports/search?perPage=1',
            failOnStatusCode: false,

            body: {
                "filter": {
                    "startDate": "01/01/2021",
                    "endDate": "01/01/20"
                }
            },

            headers: {
                "content-type": "application/json",
                "apikey": "r7FWO2c1BnvUbL9DyFYCwS6wxxuqRiO3",
                'Authorization': this.data.Bearer,
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                "origin": "https://staging.oneomg.io"
            }
        }).then(function(res) {

            expect(res.headers).to.include({

                'content-type': 'application/json; charset=utf-8'
                // 'origin':'https://omg.integration.intermx.io'
            })
            cy.wait(3000)
            expect(res.status).equal(400)
            console.log(expect(res.body))
            cy.log(expect(res.body))
            expect((res.body)).has.property('api-message','End Date should be valid format(MM/DD/YYYY)')
            
        })
    })
})