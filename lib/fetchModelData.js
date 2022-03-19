var Promise = require("Promise");

/**
  * FetchModel - Fetch a model from the web server.
  *     url - string - The URL to issue the GET request.
  * Returns: a Promise that should be filled
  * with the response of the GET request parsed
  * as a JSON object and returned in the property
  * named "data" of an object.
  * If the requests has an error the promise should be
  * rejected with an object contain the properties:
  *    status:  The HTTP response status
  *    statusText:  The statusText from the xhr request
  *
*/


// function fetchModel(url) {
//   return new Promise(function(resolve, reject) {
//       console.log(url);
//       let getResponseObject = new XMLHttpRequest();
//       //getResponseObject.send();
//       getResponseObject.open("GET", url);
//       console.log("hello");
//       console.log(getResponseObject);
//       //console.log(JSON.parse(getResponseObject.responseText));
//       getResponseObject.onreadystatechange = () => {
//         if (this.readyState != 4) {
//           return;
//         }
//         if (getResponseObject.status >= 200 && getResponseObject.status < 300) {
//           resolve({data: JSON.parse(this.responseText)});
//         } else {
//           reject({status: getResponseObject.status, statusText: getResponseObject.statusText});
//         }
//       }
//       //setTimeout(() => reject({status: 501, statusText: "Not Implemented"}),0);
//   });
// }

// console.log("MODELDATAFILE");

function fetchModel(url) {
  return new Promise(function(resolve, reject) {
      let getResponseObject = new XMLHttpRequest();
      getResponseObject.open("GET", url);
      getResponseObject.send();
      getResponseObject.onreadystatechange = function() {
        if (this.readyState != 4) {
          return;
        }
        if (this.status < 200 && this.status >= 300) {
          reject({status: getResponseObject.status, statusText: getResponseObject.statusText})
        } else {
          resolve({data: JSON.parse(this.responseText)});
        }
      }   
  });
}

export default fetchModel;
