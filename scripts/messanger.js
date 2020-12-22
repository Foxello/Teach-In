document.addEventListener("DOMContentLoaded",()=>{
    if(!localStorage.getItem("ID")){
        alert("Вы не вошли в аккаунт!")

        document.location.href = "../html/login.html"
    }
    let socket = new WebSocket("ws://armacoty.tk:1234");
    const userName = localStorage.getItem("name");
    document.querySelector("#headerUserName").innerHTML = userName;
    document.querySelector(".messanger__headerKid__image").innerHTML = localStorage.getItem("name")[0].toUpperCase() + localStorage.getItem("last_name")[0].toUpperCase();
    const userList = document.querySelector(".messanger_userList__list > ul")
    const messageWindow = document.querySelector(".messanger__massageWindow__messanges > ul")
    const sendButton = document.querySelector("#sendButton")
    const messangerInput = document.querySelector("#messangerInput")
    const userIcon = document.querySelector(".messanger__headerKid__image");
    const userMenu = document.querySelector(".profileMenu")
    const findButton = document.querySelector("#findButton");
    const refreshButton = document.querySelector(".messangerListRefresh")
    const addingList = document.querySelector(".messangerSearchUserList ul")
    let addingListElement;
    let myContactList;
    findButton.addEventListener("click",()=>{
        let keys = document.querySelector(".messanger_userList__searchUser > input").value.trim().split(" ");
        let obj = {"search_keys":keys, "request":"find_users"};
        console.log(obj)
        socket.send(JSON.stringify(obj))
    })

    document.querySelector("#logOutLink").addEventListener("click",()=>{
        localStorage.clear();
        socket.send(JSON.stringify({"request":"log_out"}));
        document.location.href = "../html/login.html";
    });

    sendButton.addEventListener("click",()=>{
        socket.send(JSON.stringify({"request":"add_message","message":messangerInput.value}))
        createMessage({"from":"","message":messangerInput.value})
    })
    document.addEventListener("keydown",(e)=>{
        if(e.which === 13){
            socket.send(JSON.stringify({"request":"add_message","message":messangerInput.value}))
            createMessage({"from":"","message":messangerInput.value})
        }
        if(e.which === 27 && !addingList.parentElement.classList.contains("hidden")){
            addingList.parentElement.classList.toggle("hidden")
            addingList.innerHTML = "";
        }
    })

    userIcon.addEventListener("click",()=>{
        userMenu.classList.toggle("hidden");
    })

    function createMessage(el){
        // if(!messangerInput.value){
        //     return;
        // }
        let name;
        let div = document.createElement('li');
        if(el.from){
            div.classList.add("other")
            name = el.from
        }else{
            div.classList.add("seft")
            name = localStorage.getItem("name");
        }
        div.innerHTML = `<div><span>${name}</span><p>${el.message}</p></div>`;
        messageWindow.appendChild(div);
        messangerInput.value = "";
    }

    

    function createNewContact(arr){
        addingList.parentElement.classList.toggle("hidden")
        if(!arr){
            return;
        }
        arr.forEach(el =>{
            let li = document.createElement("li")
            li.classList.add("listItem","offline")
            li.innerHTML = `<span>${el.name} ${el.last_name}</span>`
            li.setAttribute("data-id",el.id)
            addingList.appendChild(li)
        })
        listItemEvent()
    }

    refreshButton.addEventListener("click",(e)=>{
        e.target.classList.toggle("active")
        socket.send(JSON.stringify({"request":"all_chats"}));
        let onlineUsers= setInterval(()=>{
            socket.send(JSON.stringify({"request":"online"}))
        },60000)
    })

    function createAllMessages(array){
        messageWindow.innerHTML = ""
        array.forEach(el =>{
            createMessage(el)
        })
    }

    function createContactList(array){
        myContactList = array.map(el=> el)
        refreshButton.classList.add("hidden")
        array.forEach(el =>{
            let li = document.createElement("li")
            li.classList.add("listItem", "offline")
            li.innerHTML = `<span>${el.name} ${el.last_name}</span>`
            li.setAttribute("data-id",el.id)
            userList.appendChild(li)
        })
        listItemEvent()
    }

    function listItemEvent(){
        addingListElement = document.querySelectorAll(".listItem")
        addingListElement.forEach(el =>{
            el.addEventListener("click",()=>{
                addingListElement.forEach(e =>{
                    e.classList.remove("currentListItem")
                })
                el.classList.add("currentListItem")
                socket.send(JSON.stringify({"request":"open_chat","id":el.getAttribute("data-id")}))
             }) 
        })
    }

    function updateContactsState(array){
        array.forEach(el =>{
            myContactList.forEach(ele =>{
                if(el === ele.id){
                    document.querySelector(`li[data-id='${ele.id}']`).classList.add("online")
                    document.querySelector(`li[data-id='${ele.id}']`).classList.remove("offline")
                }
            })
        })
    }

    //websocket
    socket.onopen = ()=>{
        alert("Соединение установлено!");
        socket.send(JSON.stringify({"request":"confirm_token","id":localStorage.getItem("ID"),"name":localStorage.getItem("name")}))
    }
    
    socket.onmessage = event =>{
        console.log(event.data);
        formHandler(event.data)
    }

    function formHandler(data){
        let userData = JSON.parse(data);
        switch (userData.answer) {
          case "all_find_client":
              console.log(userData.client)
              createNewContact(userData.client);
              break;
          case "successful confirm":
              console.log(userData.answer)
              break;
          case "all_chats successful":
              console.log(userData.users)
              createContactList(userData.users);
              break;
          case "chats_with":
              console.log(userData.message)
              createAllMessages(userData.message)
              break;
          case "online":
              console.log(userData.users)
              updateContactsState(userData.users)
              break;
          
          default:
              break;
            
        }
    }
});