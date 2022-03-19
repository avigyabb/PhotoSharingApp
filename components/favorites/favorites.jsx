import React from 'react';
import {
  Button
} from '@material-ui/core';
import './favorites.css';
import axios from 'axios';


/**
 * Define UserPhotos, a React componment of CS142 project #5
 */
class Favorites extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      userPhotos: {},
    };
    this.showModal = this.showModal.bind(this);
    this.hideModal = this.hideModal.bind(this);
    this.removeFavorite = this.removeFavorite.bind(this);
  }

  componentDidMount() {
    axios.get('/favoritesOfUser/' + this.props.user._id).then((value) => {
    console.log(value);
        this.setState({userPhotos: value.data});
    });
  }

//   componentDidUpdate(prevState) {
//     if(this.state !== prevState) {
//         axios.get('/favoritesOfUser/' + this.props.user._id).then((value) => {
//             console.log(value);
//             this.setState({userPhotos: value.data});
//         });
//     }
//   }

  showModal(event) {
    console.log(this);
    let modal = event.target.parentNode.nextSibling.nextSibling;
    console.log(modal);
    modal.style.display = "block";
  }

  hideModal(event) {
    console.log(this);
    let modal = event.target.parentNode.parentNode;
    modal.style.display = "none";
  }

  removeFavorite(photoId) {
    console.log(photoId);
    axios.post('/photos/removeFavorite/' + photoId, {userId: this.props.user._id}).then((value) => {
        console.log(value.data);
        this.setState({userPhotos: value.data});
    });
  }

  render() {
    let data = this.state.userPhotos;
    let myList = [];
    for (let i = 0; i < data.length; i++) {
      myList.push(
        <div className="favorite_post" key={data[i]._id} id={data[i]._id}> 
          <div className="favorite">
            <img src= {"/images/" + data[i].file_name} alt="user_photos" onClick={this.showModal}></img>
          </div>
          <Button onClick={() =>{this.removeFavorite(data[i]._id);}}>Remove Favorite</Button>
          <div id="myModal" className="modal">
            <div className="modal-content">
                <span role="button" tabIndex={0} className="close" onClick={this.hideModal}>&times;</span>
                <img src= {"/images/" + data[i].file_name} alt="user_photos" onClick={this.showModal}></img>
                <p> {data[i].date_time} </p>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div>
        <h1>Favorites</h1>
        {myList}
      </div>
    );
  }
}

export default Favorites;