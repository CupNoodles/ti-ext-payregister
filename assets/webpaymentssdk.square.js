+function ($) {
    const checkoutForm = document.querySelector('#checkout-form');
    const square_payment_form_selector = '#squarePaymentForm';
    const square_mutation_callback = function(mutationsList, observer) {
        for(const mutation of mutationsList) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0){
                if(typeof mutation.addedNodes[0].querySelector == 'function' && mutation.addedNodes[0].querySelector('#squarePaymentForm') != null){
                    loadSquareForm();
                }
            }
        }
    };
    const observer = new MutationObserver(square_mutation_callback);
    observer.observe(checkoutForm, { attributes: true, childList: true, subtree: true });

    async function loadSquareForm(){
        if(document.querySelector('[name=payment][value=square]').checked){

            const square_appId = document.querySelector(square_payment_form_selector).dataset.applicationId;
            const square_locationId = document.querySelector(square_payment_form_selector).dataset.locationId;

            const square_payments = Square.payments(square_appId, square_locationId);

            
            square_card = await initializeCreditCard(square_payments);
            square_card.attach(square_payment_form_selector);

            let tokenResult;
            
            var submitCheckoutFormEventHandler = async function(e){
                const payment_input = document.querySelector('input[name="payment"]:checked');
                if (payment_input.value !== 'square'){
                    return;
                }
            
                e.preventDefault();
                
                tokenResult = await square_card.tokenize();
                if(tokenResult.status == "OK"){
                    updatePayment(tokenResult.token, square_payments);
                }
            }
            
            $('#checkout-form').on('submitCheckoutForm', submitCheckoutFormEventHandler);
            
        }
    }



    async function initializeCreditCard(payments){

        const square_card_style = {
            '.message-text': {
                color: '#A5A5A5',
            },
            '.message-icon': {
            color: '#A5A5A5',
                },
            input: {
                color: '#000',
                fontFamily: 'helvetica neue, sans-serif',
                fontSize: '16px'
            },
            'input::placeholder': {
                color: '#A5A5A5',
            }
        };

        const square_card = await payments.card({
            style: square_card_style
        });
        return square_card;
    }




    async function updatePayment(token, square_payments){

        const square_verificationDetails = {
            intent: 'CHARGE',
            amount: document.querySelector(square_payment_form_selector).dataset.orderTotal.toString(),
            currencyCode: document.querySelector(square_payment_form_selector).dataset.currencyCode,
            billingContact: {
                givenName: document.querySelector('input[name="first_name"]').value,
                familyName: document.querySelector('input[name="last_name"]').value
            }
        }

        const square_verificationResults = await square_payments.verifyBuyer(
            token,
            square_verificationDetails
        );

        document.querySelector('input[name="square_card_nonce"]').value = token;
        document.querySelector('input[name="square_card_token"]').value = square_verificationResults.token;

        
        $('#checkout-form').unbind('submitCheckoutForm').submit()
    }

    loadSquareForm();
}(window.jQuery)