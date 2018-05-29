'use strict';
const snoowrap = require('snoowrap');
const each = require('async/each');


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
    .then( (replies) => {
        req.replies = replies;
    })
    .then( next )
    .catch( console.log )


    //===============================================================
    // Inner functions
    
    /**
     * Gets an Array of Listings. Each Listing containing an Array of Comments
     * @param {*} r snoowrap instance 
     */

    function getAllComments(r) {

        const mws = [
            r.getRising('all').map( post => post.comments),/* 
            r.getControversial( 'all').map( post => post.comments),
            r.getTop('all').map( post => post.comments),
            r.getHot('all').map( post => post.comments),
            r.getNew('all').map( post => post.comments) */
        ];
        const retComments = [];
        
        return new Promise( (resolve, reject) => {
            each( mws, (__mw, __cb) => {
                __mw.then( async (commentsListings) => {
                    return  await Promise.all( commentsListings.map( async (commentListing) => {
                        const comments =  await commentListing.fetchAll({
                            skipReplies: true
                        });
                        return comments;
                    } ))
                })
                .then( async (commentsListings) => {
                    return await Promise.all( commentsListings.map( (comments) => {
                        return Promise.all(
                            comments.map( (comment) => {
                                return comment.expandReplies({depth: 1});
                            } )
                        );
                    } ))
                })
                .then( (comments) => {
                    retComments.concat(comments);
                    __cb();
                })
                .catch( (err) => {
                    console.log(err);
                    reject(err);
                } )
            }, () => {
                resolve(retComments)
            })
        })
        
/* 
        return r.getRising( 'all').map( (post) => {
            //console.log(post.title);
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
        .then( async (commentsListings) => {
            return await Promise.all( commentsListings.map( (comments) => {
                return Promise.all(
                    comments.map( (comment) => {
                        return comment.expandReplies({depth: 1});
                    } )
                );
            } ))
        }) */
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
                return regexPhrase.test(comment.body) &&
                    comment.replies.every( (reply) => reply.author.name!=process.env.CLIENT_USERNAME)
            }).map( (comment) => {
                comment.indexKeyPhrase = comment.body.search(regexPhrase);
                return comment;
            })
        })
        //Flatten Listings
        .reduce( (acc, e) => acc.concat(e), [] )
        //Filter empty
        .filter( comment => Boolean(comment) );
    } 

    /**
     * Parses text to quote and replies
     * @param {*} comments 
     */
    function replyWithQoute( comments) {
        console.log("COMMENTS TO REPLY", comments.length);
        return comments.map( (comment) => {
            const { body } = comment;
            if(comment.indexKeyPhrase===-1) return;

            const reply = '>' + comment.body.slice(0, comment.indexKeyPhrase+22);
            console.log("COMMENT", comment.indexKeyPhrase, comment.body);
            console.log("QUOTING", reply);

            comment.reply( reply );

            return reply;
        })
        return;
    }
}
