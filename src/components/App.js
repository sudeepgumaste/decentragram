import React, { useEffect, useState } from "react";
import Web3 from "web3";
import "./App.css";
import Decentragram from "../abis/Decentragram.json";
import Navbar from "./Navbar";
import Main from "./Main";
import ipfsClient from "ipfs-http-client";

// initialize ipfs client
const ipfs = ipfsClient({
  host: "ipfs.infura.io",
  port: 5001,
  protocol: "https",
});

const App = () => {
  const [account, setAccount] = useState("");
  const [loading, setLoading] = useState(false);
  const [decentragram, setDecentragram] = useState(null);
  const [images, setImages] = useState([]);
  const [buffer, setBuffer] = useState(null);

  useEffect(() => {
    (async () => {
      const web3 = await initWeb3();
      window.web3 = web3;
      await loadBlockchainData();
    })();
  }, []);

  const initWeb3 = async () => {
    if (typeof window.ethereum !== "undefined") {
      new Web3(window.ethereum);
      try {
        await window.ethereum.enable();
        return new Web3(window.ethereum);
      } catch (e) {
        console.log(e);
      }
    }
    if (typeof window.web3 !== "undefined") {
      return new Web3(window.web3.currentProvider);
    }
    return new Web3("http://localhost:7545");
  };

  const loadBlockchainData = async () => {
    const web3 = window.web3;
    const accounts = await web3.eth.getAccounts();
    setAccount(accounts[0]);

    const networkId = await web3.eth.net.getId();
    const networkData = Decentragram.networks[networkId];

    if (networkData) {
      const _decentragram = new web3.eth.Contract(
        Decentragram.abi,
        networkData.address
      );
      setDecentragram(() => _decentragram);
    } else {
      window.alert(
        "Decentragram has not been deployed on the detected network"
      );
    }
  };

  const loadImages = async () => {
    setLoading(true);
    const imageCount = await decentragram.methods.imageCount().call();
    let _images = [];
    for (let i = 1; i <= imageCount; i++) {
      const _image = await decentragram.methods.images(i).call();
      _images = [..._images, _image];
    }

    _images = _images.sort((a,b) => b.tipAmount - a.tipAmount)
    setLoading(false);
    setImages(_images);
  };

  const uploadImage = (description) => {
    console.log("Submitting to ipfs");
    setLoading(true);
    ipfs.add(buffer, (error, result) => {
      console.log("ipfsResult", result);
      if (error) {
        console.log(error);
        setLoading(false);
        return;
      }

      decentragram.methods
        .uploadImage(result[0].hash, description)
        .send({
          from: account,
        })
        .then((hash) => {
          console.log(hash);
          setLoading(false);
        });
    });
  };

  useEffect(() => {
    if (decentragram) {
      loadImages();
    }
  }, [decentragram]);

  const captureFile = (e) => {
    e.preventDefault();
    const file = e.target.files[0];

    const reader = new window.FileReader();
    reader.readAsArrayBuffer(file);

    reader.onloadend = () => {
      setBuffer(Buffer(reader.result));
    };
  };

  const tipImageOwner = (id, tipAmount) => {
    decentragram.methods
      .tipImageOwner(id)
      .send({ from: account, value: tipAmount })
      .on("transaction", (hash) => {
        console.log(hash);
      });
  };

  return (
    <div>
      <Navbar account={account} />
      {loading ? (
        <div id="loader" className="text-center mt-5">
          <p>Loading...</p>
        </div>
      ) : (
        <Main
          captureFile={captureFile}
          uploadImage={uploadImage}
          tipImageOwner={tipImageOwner}
          images={images}
        />
      )}
    </div>
  );
};

export default App;
