before(function () {
    // example.json is our test data for our spec/class file
    cy.fixture('test_data').then(function (data) {
        this.data = data
    })
})

describe('BillinExportFilterSearchByStartEndDate', function () {

    it('POST', function () {
        cy.wait(10000)
        cy.request({
            method: 'POST',
            url: 'https://intermx-test.apigee.net/v1/contracts/billing-exports/search?perPage=1',

            body: {
                "filter": {
                    "startDate": "01/01/2021",
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
                // 'origin':'https://omg.integration.intermx.io'
            })
            expect(res.status).equal(200)
            expect(res.body).have.property('results')
            expect(res.body).have.property('pagination')
            //verify all the details of results
            //expect(res.body.results[9]).has.property(this.data.lineItemId, 'ASDASDASDAASDASDASDASDASDASDASDASDASDASDASDASDASDASDASDASDASDAS-50158-342')
            expect(res.body.results[0]).has.property('productCode', 'CLE')
            //expect(res.body.results[0]).has.property('clientName', 'McDonald's Ohio - Northeast (ZF5)')
            // expect(res.body.results[9]).has.property(this.data.productName, 'TVP Products 2')
            // expect(res.body.results[9]).has.property(this.data.estimateName, 'VARUN ESTIMATION NEW & UPDATED 001 2')
            // expect(res.body.results[9]).has.property(this.data.mediaDescription, 'S/S CYPRESS GARDENS BLVD 200 FT. E/O 540 A W/B')
            // expect(res.body.results[9]).has.property(this.data.netCost, 200)
            // expect(res.body.results[9]).has.property(this.data.doNotExport, false)
            // expect(res.body.results[9]).has.property(this.data.deletedStatus, false)
            // expect(res.body.results[9]).has.property(this.data.exportedStatus, false)
             expect(res.body.results[0]).has.property('insertionDate', '2021-01-01')
        })
    })
})