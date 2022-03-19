import React from 'react';
import {
  Typography
} from '@material-ui/core';
import './userComments.css';
import axios from 'axios';


/**
 * Define UserPhotos, a React componment of CS142 project #5
 */
class UserComments extends React.Component {
constructor(props) {
    super(props);
    this.state = {
    userId: this.props.match.params.userId,
    userPhotos: {}
    };
    //console.log(props);
}

componentDidMount() {
    console.log("run");
    axios.get('/userComments/' + this.state.userId).then((value) => {
    this.setState({userPhotos: value.data});
    console.log(value);
    //console.log(value[0].comments[0]._id);
    });
}

componentDidUpdate(prevProps) {
    if(this.props !== prevProps) {
    console.log("run2");
    axios.get('/userComments/' + this.state.userId).then((value) => {
    this.setState({userPhotos: JSON.parse(JSON.stringify(value)).data});
    console.log(value);
    //console.log(value[0].comments[0]._id);
    });
}
}

render() {
    let data = this.state.userPhotos;
    console.log(data[0]);
    let myList = [];
    for (let i = 0; i < data.length; i++) {
    let commentList = [];
    if (data[i].comments) {
        let commentData = data[i].comments;
        //console.log(data[i]);
        for (let j = 0; j < commentData.length; j++) {
        //console.log(commentData);
        commentList.push(
            <div className="comments" key={i}>
            <a href={"http://localhost:3000/photo-share.html#/users/" + commentData[j].user._id}>{commentData[j].user.first_name + " " + commentData[j].user.last_name}</a>
            <p>{commentData[j].comment} <span>{commentData[j].date_time}</span></p>
            </div>
        );
        }
    }
    myList.push(
        <div className="post" key={-(i+1)}> 
        {/* <img src= {"/images/" + data[i].file_name} alt="user_photos"></img> */}
        <p>{data[i].date_time}</p>
        {commentList}
        </div>
    );
    }
    //console.log(this.state.userPhoto);
    return (
    <div>
    <Typography variant="body1">
    {/* This should be the UserPhotos view of the PhotoShare app. Since
    it is invoked from React Router the params from the route will be
    in property match. So this should show details of user:
    {this.props.match.params.userId}. You can fetch the model for the user from
    window.cs142models.photoOfUserModel(userId): */}
        {/* <Typography variant="caption">
        {JSON.stringify(window.cs142models.photoOfUserModel(this.props.match.params.userId))}
        </Typography> */}
    </Typography>
    {myList}
    </div>
    );
}
}

export default UserComments;