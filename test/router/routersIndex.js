
var express = require('express');
var router = express.Router();

//simple view
(function(...paths){
	paths.forEach((path)=>{
		require(path)(router);
	});
})('./index');

module.exports=[router];