pragma solidity ^0.5.0;

contract Decentragram {
  string public name = 'Decentragram';

  struct Image {
    uint id;
    string hash;
    string description;
    uint tipAmount;
    address payable author;
  }

  event ImageCreated (
    uint id,
    string hash,
    string description,
    uint tipAmount,
    address payable author
  );

  event ImageTipped (
    uint id,
    string hash,
    string description,
    uint tipAmount,
    address payable author
  );

  // store images
  uint public imageCount = 0;
  mapping (uint => Image) public images;

  // Create images
  function uploadImage(
    string memory _imageHash,
    string memory _description
  ) public {
    // Image hash and decription exists
    require(bytes(_description).length > 0);
    require(bytes(_imageHash).length > 0);

    // Make sure sender exists
    require(msg.sender != address(0x0));

    imageCount += 1;
    images[imageCount] = Image(imageCount, _imageHash, _description, 0, msg.sender);

    // emit an event everytime an image is created
    emit ImageCreated(imageCount, _imageHash, _description, 0, msg.sender);
  }

  // Tip images
  function tipImageOwner(uint _id) payable public {
    // id is valid
    require(_id> 0  && _id <= imageCount);

    // Fetch image
    Image memory _image = images[_id];

    address payable _author = _image.author;
    // transfer the amount to author
    address(_author).transfer(msg.value); 

    // update the tip amount
    _image.tipAmount += msg.value;

    // put the change back to mapping from memory var
    images[_id] = _image;

    // emit an event when images are tipped
    emit ImageCreated(_id, _image.hash, _image.description, _image.tipAmount, _author);
  }
}