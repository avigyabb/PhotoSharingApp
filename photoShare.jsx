import React from 'react';
import ReactDOM from 'react-dom';
import {
  HashRouter, Route, Switch, Redirect
} from 'react-router-dom';
import {
  Grid, Paper
} from '@material-ui/core';
import './styles/main.css';

// import necessary components
import TopBar from './components/topBar/TopBar';
import UserDetail from './components/userDetail/userDetail';
import UserList from './components/userList/userList';
import UserPhotos from './components/userPhotos/userPhotos';
import UserComments from './components/userComments/userComments';
import LoginRegister from './components/LoginRegister/LoginRegister';
import Favorites from './components/favorites/favorites';

class PhotoShare extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      userIsLoggedIn: false,
      user: {},
    };
    this.loggedIn = this.loggedIn.bind(this);
    this.loggedOut = this.loggedOut.bind(this);
    console.log(this.state.userIsLoggedIn);
    console.log(this.state.userIsLoggedIn);
  }

  loggedIn(user) {
    console.log("LOGGED IN USER");
    this.setState({userIsLoggedIn: true, user: user});
    window.location = "#/user/" + user._id;
  }

  loggedOut() {
    console.log("LOGGED OUT");
    this.setState({userIsLoggedIn: false, user: {}});
  }

  render() {
    return (
      <HashRouter>
      <div>
      <Grid container spacing={8}>
        <Grid item xs={12}>
          <TopBar user={this.state.user} callback={this.loggedOut}/>
        </Grid>
        <div className="cs142-main-topbar-buffer"/>
        <Grid item sm={3}>
          <Paper className="cs142-main-grid-item">
            <UserList isLoggedIn={this.state.userIsLoggedIn}/>
          </Paper>
        </Grid>
        <Grid item sm={9}>
          <Paper className="cs142-main-grid-item">
            <Switch>
              {
                this.state.userIsLoggedIn ?
                  <Route path="/user/:userId" component={UserDetail} render={ props => <UserDetail {...props} /> }/>
                :
                  <Redirect path="/user/:userId" to="/login-register" render={ props => <LoginRegister {...props } callback={this.loggedIn}/> }/>
              }
              <Route path="/login-register"
                render={ props => <LoginRegister {...props} callback={this.loggedIn}/> }
              />
              {/* <Route path="/"
                render={ props => <LoginRegister {...props} callback={this.loggedIn}/> }
              /> */}
              {
                this.state.userIsLoggedIn ?
                  <Route path="/photosOfUser/:userId" render ={ props => <UserPhotos user={this.state.user} {...props} /> }/>
                :
                  <Redirect path="/photosOfUser/:userId" to="/login-register" render={ props => <LoginRegister {...props } callback={this.loggedIn}/> }/>
              }
              {
                this.state.userIsLoggedIn ?
                  <Route path="/userComments/:userId" render ={ props => <UserComments {...props} /> }/>
                :
                  <Redirect path="/userComments/:userId" to="/login-register" render={ props => <LoginRegister {...props } callback={this.loggedIn}/> }/>
              }
              {
                this.state.userIsLoggedIn ?
                  <Route path="/users" component={UserDetail} render={ props => <UserDetail {...props} /> }/>
                :
                  <Redirect path="/users" to="/login-register" render={ props => <LoginRegister {...props } callback={this.loggedIn}/> }/>
              }
              {
                this.state.userIsLoggedIn ?
                  <Route path="/favorites" render ={ props => <Favorites user={this.state.user} {...props} /> }/>
                :
                  <Redirect path="/favorites" to="/login-register" render={ props => <LoginRegister {...props } callback={this.loggedIn}/> }/>
              }
              
            </Switch>
          </Paper>
        </Grid>
      </Grid>
      </div>
      </HashRouter>
    );
  }
}


ReactDOM.render(
  <PhotoShare />,
  document.getElementById('photoshareapp'),
);
