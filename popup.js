document.addEventListener('DOMContentLoaded', loadDataFromStorage);
document.getElementById('usernameInput').addEventListener('input', updateResults);
document.getElementById('emailInput').addEventListener('input', updateResults);

document.getElementById('copyAllButton').addEventListener('click', copyAllEmails);
// if browser == chrome, storage = chrome.storage
function addonLog(...args) {
    // prepend extension name 
    console.log('duck_mail_converter:', args);
}
var inChrome = (typeof chrome !== 'undefined');
addonLog(inChrome);
const storage = inChrome ? chrome.storage.sync : browser.storage.sync;

async function loadStorageBrowserCompat(keys) {
    if (inChrome) {
        return new Promise(resolve => storage.get(keys, resolve));
    }
    return storage.local.get(keys);
}

function getAllEmails() {
    const emails = Array.from(document.querySelectorAll('.result-item span')).map(span => span.textContent).filter(email => email);
    const joinedEmails = emails.join(';');
    return joinedEmails;
}

function copyAllEmails() {
    const element = document.getElementById('copyAllButton');
    navigator.clipboard.writeText(element.title).then(() => {
        addonLog("copy all emails done.");
    }).catch(err => {
        addonLog('Something went wrong copying all emails', err);
    });
}

function updateJoinedbuttons() {
    const joinedEmails = getAllEmails();
    document.getElementById("copyAllButton").title = joinedEmails;

    const mailAllElement = document.getElementById('mailtoAllButton');
    mailAllElement.href = "mailto:" + joinedEmails;
    mailAllElement.title = mailAllElement.href;

    Array.from(document.getElementsByClassName("copy-button")).forEach(button => {
        button.addEventListener('click', (event) => {
            const tgt = event.currentTarget;
            // https://stackoverflow.com/questions/57278923/chrome-76-copy-content-to-clipboard-using-navigator
            const blob = new Blob([tgt.title], { type: 'text/plain' });
            const item = new ClipboardItem({ 'text/plain': blob });
            navigator.clipboard.write([item]).catch(error => {
                console.error("unable to write to clipboard. Error:", error);
            });
        }, false);
    });
}

async function loadDataFromStorage() {
    const data = await loadStorageBrowserCompat(['username', 'emailInput']);
    const username = data['username'];
    const emailInput = data['emailInput'];
    if (username) {
        document.getElementById('usernameInput').value = username;
    }
    if (emailInput) {
        document.getElementById('emailInput').value = emailInput;
        updateResults(); // Update results with the loaded username
    }
}

function updateResults() {
    const usernameInput = document.getElementById('usernameInput');
    const username = usernameInput.value.trim();
    const emailInput = document.getElementById('emailInput').value.trim();
    const resultContainer = document.getElementById('resultContainer');
    resultContainer.innerHTML = '';

    // Save the username to storage
    storage.set({ 'username': username, 'emailInput': emailInput });

    if (!emailInput) {
        return;
    }
    const emails = emailInput.split(/ |\n/);
    emails.forEach(email => {
        const convertedEmail = convertEmail(email, username);
        if (!convertedEmail) {
            return;
        }
        const resultRow = document.createElement('tr');
        resultRow.innerHTML = `
                    <td class="result-item"> <span>${convertedEmail}</span></td>
                    <td><button class="copy-button" title="${convertedEmail}">Copy</button></td>
                    <td><a class="mailto-link" href="mailto:${convertedEmail}" title="mailto:${convertedEmail}">Mail</a></td>
                `;
        resultContainer.appendChild(resultRow);
    });
    updateJoinedbuttons();
}


function convertEmail(email, username) {
    const formattedEmail = email
        .replace(/\[at\]/gi, '@')
        .replace(/\[dot\]/gi, '.')
        .trim();

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailPattern.test(formattedEmail)) {
        const split = formattedEmail.split('@');

        const localPart = split[0];
        const originalDomain = split[1];
        return `${localPart}_at_${originalDomain}_${username}@duck.com`;
    }
    return null;
}
