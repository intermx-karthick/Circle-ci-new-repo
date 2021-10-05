
/// <reference types="Cypress" />
import example from '../../fixtures/test_data.json'


class LoginPage {

    loginToOneOmg() {
        cy.wait(20000)
       // cy.visit(Cypress.env('oneomgurl'));
        cy.get("input[type='email']").type("test-keith-guerke@intermx.com");
        cy.get("input[type='password']").type("testkeith@123");
        return cy.get('#btn-login').click();

    }

    loginToStaging() {
        cy.wait(2000)
        cy.visit(Cypress.env('url'));
        cy.get("[type=email]").type("test-keith-guerke@intermx.com");
        cy.get("[type=password]").type("testkeith@123");
        return cy.get('#btn-login').click();

    }
    generate_random_string() {
        const uuid = () => Cypress._.random(0, 1e6)
        const id = uuid()
        const testname = `cypress-automation${id}`
        return testname;
    }


    logOut() {

        return  cy.get('.expand').click().get('.mat-menu-content > :nth-child(4)').click()
        

    }

    launchAppication() {

        return cy.visit("https://omg.integration.intermx.io");
    }

    enterUserName() {

        return cy.get("input[type='email']");

    }

    enterPassword() {

        return cy.get("input[type='password']");

    }

    clickLoginButton() {
       
        return cy.get("#btn-login");

    }

}

export default LoginPage;