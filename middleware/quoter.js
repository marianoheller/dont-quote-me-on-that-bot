'use strict';
const snoowrap = require('snoowrap');
 


module.exports = function( req, res, next) {
    // Alternatively, just pass in a username and password for script-type apps.
    try {
        var r = new snoowrap({
            userAgent: process.env.USER_AGENT,
            clientId: process.env.CLIENT_ID,
            clientSecret: process.env.CLIENT_SECRET,
            username: process.env.CLIENT_USERNAME,
            password: process.env.CLIENT_PASSWORD
        });
    } catch(err) {
        throw err;
    }
    
    // Printing a list of the titles on the front page
    r.getRising({limit: 25}).map( (post) => post.comments)
    .then( async (commentsListings) => {
        return  await Promise.all( commentsListings.map( async (commentListing) => {
            const comments =  await commentListing.fetchAll({
                skipReplies: true
            });
            return comments;
        } ))
    })
    .then( (commentsListings) => {
        const regexPhrase = /don.?t quote me on that/i;
        return commentsListings.map( (comments) => 
            comments.filter( (comment) => {
                if(comment.author.name === 'TW_mcnuggets') console.log(comment);
                return regexPhrase.test(comment.body)
            })
        ).filter( comments => Boolean(comments.length) );
    })
    .then( (commentsListings) => {
        commentsListings.forEach( (comments) => comments.forEach( (comment) => console.log));
    })
    .then( () => {
        next();
    })
    .catch( (err) => {
        console.log(err);
    })
  
}
