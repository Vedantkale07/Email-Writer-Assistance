console.log("Email Writer Extension - Content Script is loaded");

function createAIButton(){
   const button = document.createElement('div');
   button.className='T-I J-J5-Ji aoO v7 T-I-atl L3';
   button.style.margin='8px';
   button.innerHTML='AI Replay';
   button.setAttribute('role','button');
   button.setAttribute('data-tooltip', 'Generate AI Replay');

   return button;
}

function getEmailContent(){
     const selectors=[
        '.h7',
        '.a3s.aiL',
        '.gmail_quote',
        '[role="presentation"]'
    ];

    for(const Selector of selectors){
        const content=document.querySelector(Selector);
        if(content){
            return content.innerText.trim();
        }else{
            return '';
        }
    }
}


function findComposeToolbar(){
     const selectors=[
        '.btC',
        '.aDh',
        '[role="toolbar"]',
        '.gU.Up'
    ];

    for(const selector of selectors){
        const toolbar=document.querySelector(selector);
        if(toolbar){
            return toolbar;
        }else{
            null;
        }
    }
}

function injectButton() {
    // Your button injection logic goes here
    const existingButton = document.querySelector('ai-replay-button');
    if(existingButton) existingButton.remove();

    const toolbar= findComposeToolbar();
    if(!toolbar){
        console.log("Toolbar not found");
        return;
    }
    console.log("Toobar is found, creating AI Button");
    const button= createAIButton();
    button.classList.add('ai-replay-button');

    // this have the all code  to do the  backend api call 
    // get the response and inject to document object model (DOM)
    button.addEventListener('click', async() => {
        try {
            button.innerHTML = "Generating...";
            button.disabled=true;

            const emailContent= getEmailContent();
         const response= await fetch('http://localhost:8080/api/email/generate',{
                method:'post',
                headers:{
                    'Content-Type':'application/json',
                },
                body:JSON.stringify({
                    emailContent: emailContent,
                    tone: "professional"
                })

            });

            if(!response.ok){
                throw new Error("API Request failed!!!");           
            }

            const generatedReplay= await response.text();
            const composeBox= document.querySelector('[role="textbox"][g_editable="true"]');

            if(composeBox){
                composeBox.focus();
                document.execCommand('insertText',false, generatedReplay );
            }else{
                console.error("compose box does not found");
            }
        } catch (error) {
            console.error();
            alert('failed to generate replay');
        }finally{
            button.innerHTML = "AI Replay";
            button.disabled=false;
        }
    } );

    toolbar.insertBefore(button, toolbar.firstChild);}

const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        const addedNodes = Array.from(mutation.addedNodes);

        const hasComposeElement = addedNodes.some(node => {
            if (node.nodeType !== Node.ELEMENT_NODE) return false;

            try {
                return node.matches('.aDh, .btC, [role="dialog"]') || 
                       node.querySelector('.aDh, .btC, [role="dialog"]');
            } catch (e) {
                console.error("Error checking node:", node, e);
                return false;
            }
        });

        if (hasComposeElement) {
            console.log("Compose Window Detected!!");
            setTimeout(injectButton, 500);
        }
    }
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});
