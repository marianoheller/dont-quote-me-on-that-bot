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

    getAllComments(r)
    .then( filterComments )
    .then( replyWithQoute )
    .then( next )
    .catch( console.log )


    //===============================================================
    // Inner functions
    
    /**
     * Gets an Array of Listings. Each Listing containing an Array of Comments
     * @param {*} r snoowrap instance 
     */
    function getAllComments(r) {
        return r.getRising( 'all').map( (post) => {
            console.log(post.title);
            return post.comments;
        })
        .then( async (commentsListings) => {
            return  await Promise.all( commentsListings.map( async (commentListing) => {
                const comments =  await commentListing.fetchAll({
                    skipReplies: true
                });
                return comments;
            } ))
        })
    }

    /**
     * Filters out comments
     * By phrase
     * By already existent reply in thread
     * @param {*} commentsListings 
     */
    function filterComments(commentsListings) {
        const regexPhrase = /don.?t quote me on that/i;

        return commentsListings.map( (comments,i ) => {
            //console.log("COMMENTS", i, comments.length )
            return comments.filter( (comment) => {
                return regexPhrase.test(comment.body)
            })
        })
        .reduce( (acc, e) => acc.concat(e), [] )
        .filter( comment => Boolean(comment) );
    } 

    /**
     * Parses text to quote and replies
     * @param {*} comments 
     */
    function replyWithQoute( comments) {
        console.log("COMMENTS TO REPLY", comments.length);
        comments.forEach( (comment) => {
            comment.reply(':)');
        })
        return;
    }
}
