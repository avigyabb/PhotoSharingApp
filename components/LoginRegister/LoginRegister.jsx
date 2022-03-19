import React from 'react';
import {
  Typography,
} from '@material-ui/core';
import './LoginRegister.css';
import axios from 'axios';

/**
 * Define UserDetail, a React componment of CS142 project #5
 */
class LoginRegister extends React.Component {
  constructor(props) {
    super(props);
    console.log(props);
    this.state = {
        users: [],
        usernames: [],
    };
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleRegisterSubmit = this.handleRegisterSubmit.bind(this);
  }

  componentDidMount() {
    axios.get('/user/list').then((value) => {
      this.setState({users: value.data});
      console.log(value);
    });
  }

  handleSubmit(event) {
    let username = document.querySelector("#username");
    let login_password = document.querySelector("#login_password");
    event.preventDefault();
    axios.post('/admin/login', {login_name: username.value, password: login_password.value}).then(function(response) {
        this.props.callback(JSON.parse(JSON.stringify(response)).data.user);
    }.bind(this)).catch(err => {console.log(err);});
  }

  handleRegisterSubmit(event) {
    event.preventDefault();
    let login_name = document.querySelector("#login_name");
    let password = document.querySelector("#password");
    let password2 = document.querySelector("#password2");
    let first_name = document.querySelector("#first_name");
    let last_name = document.querySelector("#last_name");
    let loc = document.querySelector("#loc");
    let description = document.querySelector("#description");
    let occupation = document.querySelector("#occupation");
    if (password.value !== password2.value) {
        console.log("Passwords Do Not Match");
    } else {
        let newUser = {
            login_name: login_name.value,
            password: password.value,
            first_name: first_name.value,
            last_name: last_name.value,
            location: loc.value,
            description: description.value,
            occupation: occupation.value
        };
        axios.post('/user', newUser).then(function(response) {
            this.props.callback(JSON.parse(JSON.stringify(response)).data.user);
        }.bind(this)).catch(err => {console.log(err);});
    }
  }

  render() {
    for (let userObj of this.state.users) {
        this.state.usernames.push(userObj.first_name);
    }
    console.log(this.state.usernames);
    return (
        <div>
            <div className="form">
                <form onSubmit={this.handleSubmit}>
                    <div className="input-container">
                        <h1>Login</h1>
                        <Typography>Username</Typography>
                        <input type="text" id="username" required />
                        <br />
                        <Typography>Password</Typography>
                        <input type="password" id="login_password" required />
                    </div>
                    <div className="button-container">
                        <input type="submit" onClick={this.handleSubmit}/>
                    </div>
                </form>
            </div>
            <div className="register-form">
                <form onSubmit={this.handleRegisterSubmit}>
                    <div className="input-container">
                        <h1>Register</h1>
                        <Typography>Username</Typography>
                        <input type="text" id="login_name" required />
                        <br/>
                        <Typography>Password</Typography>
                        <input type="password" id="password" required />
                        <br/>
                        <Typography>Re-Enter Password</Typography>
                        <input type="password" id="password2" required />
                        <br/>
                        <Typography>First Name</Typography>
                        <input type="text" id="first_name" required />
                        <br/>
                        <Typography>Last Name</Typography>
                        <input type="text" id="last_name" required />
                        <br/>
                        <Typography>Location</Typography>
                        <input type="text" id="loc" />
                        <br/>
                        <Typography>Description</Typography>
                        <input type="text" id="description" />
                        <br/>
                        <Typography>Occupation</Typography>
                        <input type="text" id="occupation" />
                        <br/>
                    </div>
                    <div className="button-container">
                        <input type="submit" onClick={this.handleRegisterSubmit}/>
                    </div>
                </form>
            </div>
        </div>
    );
  }
}

export default LoginRegister;