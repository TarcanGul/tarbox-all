document.querySelector('#mac-link').addEventListener('click', async (e) => {
    console.log('download clicked');

    // const jwtPayload = {
    //     stat: true
    // }

    // const SECRET_KEY = "something";

    // const token = sign(jwtPayload, SECRET_KEY);

    // const authorizationHeader = "Bearer " + token; 

    const headers = new Headers();
    // headers.append("Authorization", authorizationHeader);

    const payload = {
        event: 'DOWNLOAD_MAC'
    }

    const res = await fetch("/api/app/event/download", {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload)
    })

    if(!res.ok) {
        console.warn(`Event is not sent, response ${res.status}`);
    }
    else {
        console.log('Event is sent!');
    }

})