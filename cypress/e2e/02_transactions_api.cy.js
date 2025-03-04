describe("Transactions API Tests", () => {
    let authToken;
    let walletId;
    let transactionId;

    before(() => {
        cy.loginAs("newUser").then(({token, userId}) => {
            authToken = token; // Store auth token
            return cy.request({
                method: "GET",
                url: `/user/info/${userId}`,
                headers: {Authorization: `Bearer ${authToken}`}
            });
        }).then((response) => {
            expect(response.status).to.eq(200);
            walletId = response.body.walletId; // Store wallet ID
        });
    });


    it("Retrieve all transactions for a wallet", () => {
        cy.request({
            method: "GET",
            url: `/wallet/${walletId}/transactions`,
            headers: {Authorization: `Bearer ${authToken}`}
        }).then((response) => {
            expect(response.status).to.eq(200);
            expect(response.body.transactions).to.be.an("array");
            expect(response.body.totalCount).to.be.a("number");
        });
    });

    it("Creates and retrieves a specific transaction by ID", () => {
        cy.request({
            method: "POST",
            url: `/wallet/${walletId}/transaction`,
            headers: {Authorization: `Bearer ${authToken}`},
            body: {currency: "EUR", amount: 20}
        }).then((response) => {
            expect(response.status).to.eq(200);
            expect(response.body).to.have.property("transactionId").and.not.be.empty;
            const transactionId = response.body.transactionId;

            // Explicitly ensure transactionId is valid before making the GET request
            return cy.wrap(transactionId).should("not.be.empty").then(() => {
                return cy.request({
                    method: "GET",
                    url: `/wallet/${walletId}/transaction/${transactionId}`,
                    headers: {Authorization: `Bearer ${authToken}`}
                });
            });
        }).then((response) => {
            expect(response.status).to.eq(200);
            expect(response.body.transactionId).to.exist;
            expect(response.body.transactionId).to.be.a("string");
            expect(response.body.transactionId).to.have.length.above(0);
            expect(response.body).to.have.property("status").that.is.oneOf(["pending", "finished"]);
            expect(response.body).to.have.property("outcome").that.is.oneOf(["approved", "denied", "pending"]);
            expect(response.body).to.have.property("createdAt");
            expect(response.body).to.have.property("updatedAt");
        });
    });


    it("Verify wallet balance after approved transaction", () => {
        cy.request({
            method: "POST",
            url: `/wallet/${walletId}/transaction`,
            headers: {Authorization: `Bearer ${authToken}`},
            body: {currency: "USD", amount: 100}
        }).then((response) => {
            const transactionId = response.body.transactionId;
            expect(response.status).to.eq(200);

            // Explicitly ensure transactionId is valid before making the GET request
            return cy.wrap(transactionId).should("not.be.empty").then(() => {
                return cy.request({
                    method: "GET",
                    url: `/wallet/${walletId}/transaction/${transactionId}`,
                    headers: {Authorization: `Bearer ${authToken}`}
                });
            });
        }).then((response) => {
            if (response.body.status === "finished" && response.body.outcome === "approved") {
                cy.request({
                    method: "GET",
                    url: `/wallet/${walletId}`,
                    headers: {Authorization: `Bearer ${authToken}`}
                }).then((walletResponse) => {
                    expect(walletResponse.status).to.eq(200);
                    const currencyClip = walletResponse.body.currencyClips.find(c => c.currency === "USD");
                    expect(currencyClip).to.exist;
                    expect(currencyClip.balance).to.be.gte(100);
                });
            }
        });
    });
});
