Cypress.Commands.add("loginAs", (userType) => {
    return cy.fixture("users").then((users) => {
        const { username, password } = users[userType];

        return cy.request({
            method: "POST",
            url: "/user/login",
            headers: { "X-Service-Id": "TZg262l54FnzFuSzi8F5J3W9s61iS0L681WnTJ0k8k0" },
            body: { username, password }
        }).then((response) => {
            expect(response.status).to.eq(200);
            return {
                token: response.body.token,
                userId: response.body.userId // Extract userId from login response
            };
        });
    });
});
