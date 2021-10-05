before(function () {
    // example.json is our test data for our spec/class file
    cy.fixture('test_data').then(function (data) {
        this.data = data
    })
})


describe('BillinExportFilterSearchBylineItemID', function () {

    it('POST', function () {
        cy.wait(10000)
        cy.request({
            method: 'POST',
            url: 'https://intermx-test.apigee.net/v1/contracts/billing-exports/search?perPage=1',

            body: {
                "filter": {

                    "parentVendorIds": ["6095ab56242bfc00198e427e"]
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
          //  expect(res.body.pagination).have.property('total', 1334)
            //expect(res.body.pagination).have.property('found', 615)
            expect(res.body.pagination).have.property('page', 1)
            expect(res.body.pagination).have.property('perPage', 1)
            expect(res.body.pagination).have.property('pageSize', 0)

            //expect(res.body.results[0]).has.property('lineItemId', '122-vcgh-50114-3')

//            expect(res.body.results[0]).has.property('productCode', 'vcgh')
           // expect(res.body.results[0]).has.property('clientName', 'Netflix, Inc.')
            //expect(res.body.results[0]).has.property('productName','Specials')
            // expect(res.body.results[0]).has.property('estimateName', 'Woman In The Window')
            // expect(res.body.results[0]).has.property('mediaDescription', 'Six Flags network, 15 parks, 300 screens')
            // expect(res.body.results[0]).has.property('netCost', 300)
            // expect(res.body.results[0]).has.property('doNotExport', false)
            // expect(res.body.results[0]).has.property('deletedStatus', false)
            // expect(res.body.results[0]).has.property('exportedStatus', true)

               //verify all the details of vendor
        //     expect(res.body.results[0].vendor).has.property('name', 'Clear Channel Airports'),
        //   expect(res.body.results[0].vendor).has.property('parentCompany', 'CLEAR CHANNEL')

           //verify all the details of vendor pubA
        //    expect(res.body.results[0].vendor.pubA).has.property('id', '60000361')
        //    expect(res.body.results[0].vendor.pubA).has.property('edition', null)

           //verify all the details of parentVendor
        //    expect(res.body.results[0].parentVendor).has.property('name', 'CLEAR CHANNEL')
        //    expect(res.body.results[0].parentVendor).has.property('_id', '6095ab56242bfc00198e427e')
         
        })
    });
})