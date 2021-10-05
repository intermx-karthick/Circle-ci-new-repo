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

                    "lineItemIDs": ["NFX-SPC-50079-17"]
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
         //   expect(res.body.pagination).have.property('total', 1334)
            expect(res.body.pagination).have.property('found', 0)
            expect(res.body.pagination).have.property('page', 1)
            expect(res.body.pagination).have.property('perPage', 1)
            expect(res.body.pagination).have.property('pageSize', 0)

            //expect(res.body.results[0]).has.property('lineItemId', 'NFX-SPC-50079-17')

            //expect(res.body.results[0]).has.property('productCode', 'SPC')
//            expect(res.body.results[0]).has.property('clientName', 'Netflix, Inc.')
           // expect(res.body.results[0]).has.property('productName','Specials')
/*            expect(res.body.results[0]).has.property('estimateName', 'Woman In The Window')
            expect(res.body.results[0]).has.property('mediaDescription', 'Six Flags network, 15 parks, 300 screens')
            expect(res.body.results[0]).has.property('netCost', 300)
            expect(res.body.results[0]).has.property('doNotExport', false)
            expect(res.body.results[0]).has.property('deletedStatus', false)
            expect(res.body.results[0]).has.property('exportedStatus', true)*/
               //verify all the details of vendor
          /*  expect(res.body.results[0].vendor).has.property('name', 'Clear Channel Airports'),
          expect(res.body.results[0].vendor).has.property('parentCompany', 'CLEAR CHANNEL')

           //verify all the details of vendor pubA
           expect(res.body.results[0].vendor.pubA).has.property('id', '60000361')
           expect(res.body.results[0].vendor.pubA).has.property('edition', null)

           //verify all the details of parentVendor
           expect(res.body.results[0].parentVendor).has.property('name', 'CLEAR CHANNEL')
           expect(res.body.results[0].parentVendor).has.property('_id', '6095ab56242bfc00198e427e')*/
         








            // expect(res.body).have.property(this.data.results)
            // expect(res.body).have.property(this.data.pagination)

            // //verify all the details of pagination
            // expect(res.body.pagination).has.property(this.data.total, 4132)
            // expect(res.body.pagination).has.property(this.data.page, 1)
            // expect(res.body.pagination).has.property(this.data.perPage, 10)
            // expect(res.body.pagination).has.property(this.data.pageSize, 1)

            // //verify all the details of results
            // expect(res.body.results[0]).has.property(this.data.lineItemId, '@786@-&123&-50163-27')
            // expect(res.body.results[0]).has.property(this.data.productCode, '&123&')
            // expect(res.body.results[0]).has.property(this.data.clientName, this.data.JAVED_MIANDED)
            // expect(res.body.results[0]).has.property(this.data.productName, this.data.VARUN_PRADEEP_THIYAGARAJAN)
            // expect(res.body.results[0]).has.property(this.data.estimateName, this.data.BEST_BOWLING)
            // expect(res.body.results[0]).has.property(this.data.mediaDescription, this.data.Test)
            // expect(res.body.results[0]).has.property(this.data.netCost, 1000)
            // expect(res.body.results[0]).has.property(this.data.doNotExport, false)
            // expect(res.body.results[0]).has.property(this.data.deletedStatus, false)
            // expect(res.body.results[0]).has.property(this.data.exportedStatus, false)

            // //verify all the details of vendor
            // expect(res.body.results[0].vendor).has.property(this.data.name, this.data.Micheal_Clarke),
            //     expect(res.body.results[0].vendor).has.property(this.data.parentCompany, this.data.RICKY_POINTING)

            // //verify all the details of vendor pubA
            // expect(res.body.results[0].vendor.pubA).has.property(this.data.id, '7777777')
            // expect(res.body.results[0].vendor.pubA).has.property(this.data.edition, '777777777')

            // //verify all the details of parentVendor
            // expect(res.body.results[0].parentVendor).has.property(this.data.name, this.data.RICKY_POINTING)
            // expect(res.body.results[0].parentVendor.pubA).has.property(this.data.id, '34546757')
            // expect(res.body.results[0].parentVendor.pubA).has.property(this.data.edition, '352436557')

        })
    })
})