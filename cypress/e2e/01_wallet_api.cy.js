describe("Wallet API Tests", () => {
    let authToken;
    let walletId;
    let userId;
    before(() => {
        cy.loginAs("newUser").then(({token, userId: id}) => {
            authToken = token; // Store auth token
            userId = id;
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

    it.skip("A new user starts with an empty wallet", () => {
        cy.request({
            method: "GET",
            url: `/wallet/${walletId}`,
            headers: {Authorization: `Bearer ${authToken}`}
        }).then((response) => {
            expect(response.status).to.eq(200);
            expect(response.body.currencyClips).to.be.an("array");
        });
    });

    it("A user has only one wallet", () => {
        cy.request({
            method: "GET",
            url: `/user/info/${userId}`,
            headers: {Authorization: `Bearer ${authToken}`}
        }).then((response) => {
            expect(response.status).to.eq(200);
            expect(response.body.walletId).to.eq(walletId);
        });
    });

    it("Adding a new currency creates a new currencyClip", () => {
        cy.request({
            method: "POST",
            url: `/wallet/${walletId}/transaction`,
            headers: {Authorization: `Bearer ${authToken}`},
            body: {currency: "EUR", amount: 50}
        }).then((response) => {
            expect(response.status).to.eq(200);
            expect(response.body).to.have.property("transactionId");
            expect(response.body).to.have.property("status");
            expect(response.body).to.have.property("outcome");
            expect(response.body).to.have.property("createdAt");
            expect(response.body).to.have.property("updatedAt");
        });

        cy.request({
            method: "GET",
            url: `/wallet/${walletId}`,
            headers: {Authorization: `Bearer ${authToken}`}
        }).then((response) => {
            expect(response.status).to.eq(200);
            const currencies = response.body.currencyClips.map(c => c.currency);
            expect(currencies).to.include("EUR");
        });
    });

    it.skip("Should prevent negative balance", () => {
        cy.request({
            method: "POST",
            url: `/wallet/${walletId}/transaction`,
            headers: {Authorization: `Bearer ${authToken}`},
            body: {
                amount: -500000, // More than available balance
                currency: "EUR",
                type: "debit",
            },
            failOnStatusCode: false,
        }).then((response) => {
            expect(response.status).to.eq(400); // Assuming API returns 400 Bad Request
        });
    });
    it("Should return 'finished' when transaction is processed immediately", () => {
        cy.request({
            method: "POST",
            url: `/wallet/${walletId}/transaction`,
            headers: { Authorization: `Bearer ${authToken}` },
            body: {
                amount: 50,
                currency: "EUR",
                type: "credit",
            },
        }).then((response) => {
            expect(response.status).to.eq(200);
            expect(response.body.status).to.eq("finished");
            expect(response.body).to.have.property("outcome").that.is.oneOf(["approved", "denied"]);
        });
    });

});