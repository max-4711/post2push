# post2push API endpoints

## Base route: PIPELINE_INSERT_APP_URL/

## GET /
__Description:__ Can be used as indicator for availability of the post2push service.


## DELETE /
__Description:__ Initiates a cleanup mechanism: Subscriptions with delivery details not updated for 3 years and channels not used for at least 365 days (and their subscriptions) will be purged from the database.

__Parameters:__
* ChannelCreationSecret: Secret configured in app.config.js in order to prove to be authorized to delete channels.

__Returns:__
* Error (if applicable): One sentence explaining what has gone wrong.
* Message (if applicable): Confirmation for channel deletion, including the number of affected database rows.


## POST /channels/
__Description:__ Creates a new push channel.

__Accepted content type:__ application/json

__Parameters:__
* Name: Desired name of the new push channel. Will also be used to uniquely identify the channel on the server. Maximum length is 50 characters. Only characters a-Z and 0-9 are allowed. If a channel with same name already exists, channel creation will fail.
* ChannelCreationSecret: Secret configured in app.config.js in order to prove to be authorized to create new channels.
* SubscriptionSecret (optional): Desired secret, which will be needed to subscribe to the channel. If not provided, created channel can be subscribed without any authentication. Maximum length is 40 characters.
* IconUrl (optional): URL of any image, which will be shown in push notifications posted to the channel. If not provided, no icon will be shown. Maximum length is 200 characters.

__Returns:__
* Error (if applicable): One sentence explaining what has gone wrong.
* Message (if applicable): Confirmation for channel creation, if no error has occurred.
* PushSecret (if applicable): Secret, which will be needed in order to push messages to the channel.


## PUT /channels/:name
__Description:__ Updates IconUrl and SubscriptionSecret of an existing channel.

__Accepted content type:__ application/json

__Parameters:__
* name (in route): Name of the target push channel
* ChannelCreationSecret: Secret configured in app.config.js in order to prove to be authorized to edit channels.
* SubscriptionSecret (optional): Desired secret, which will be needed to subscribe to the channel. If not provided, created channel can be subscribed without any authentication. Maximum length is 40 characters.
* IconUrl (optional): URL of any image, which will be shown in push notifications posted to the channel. If not provided, no icon will be shown. Maximum length is 200 characters.

__Returns:__
* Error (if applicable): One sentence explaining what has gone wrong.
* Message (if applicable): Confirmation for channel creation, if no error has occurred.


## DELETE /channels/:name
__Description:__ Deletes a push channel.

__Parameters:__
* name (in route): Name of the target push channel
* ChannelCreationSecret: Secret configured in app.config.js in order to prove to be authorized to delete channels.

__Returns:__
* Error (if applicable): One sentence explaining what has gone wrong.
* Message (if applicable): Confirmation channel has been deleted.


## POST /channels/:name/push
__Description:__ Sends a message into a push channel.

__Accepted content type:__ application/json

__Parameters:__
* name (in route): Name of the target push channel.
* MessageContent: Content of the push notification.
* MessageTitle: Title of the push notification.
* PushSecret: Secret in order to prove to be authorized to push to this channel.
* MessageIsPersistent (optional): boolean, which prevents the notification from automatically disappearing after a while, if set to true. Defaults to false and may not be supported by all receivers.
* ActionUrl (optional): Extends the notification by a button which will cause the passed URL to be opened, if the user clicks on it. May not be supported by all receivers.

__Returns:__
* Error (if applicable): One sentence explaining what has gone wrong.
* Message (if applicable): Confirmation for notifications have been sent.

__Remarks:__
The server may also return additional information about the count of push notifications dispatched, including statistics about errors and/or successful deliveries. Please note, that these numbers -if provided- only reference delivery to the push notification provider, not to their endpoints.


## POST /clients/
__Description:__ Registers a new client (= receiver for push notifications)

__Accepted content type:__ application/json

__Parameters:__
* DeliveryDetails: Object containing information about VAPID push notification delivery
    * endpoint
    * keys
        * auth
        * p256dh
* Name (optional): View name for this client. Won't be programmatically evaluated. Maximum supported length is 50 characters.   

__Returns:__
* Error (if applicable): One sentence explaining what has gone wrong.
* Message (if applicable): Confirmation client has been registered.
* SubscriptionToken (if applicable): Token, which can be used to reference this client.

__Remarks:__
There can't exist two clients with the same DeliveryDetails, as this would result in double notifications. Trying to register two clients with the same DeliveryDetails will result in a database error, as the uniqueness of the DeliveryDetails is not checked before being passed to the database for performance reasons.


## DELETE /clients/:token
__Description:__ Deletes a client and all referencing subscriptions.

__Parameters:__
* token (in route): Token identifying the client

__Returns:__
* Error (if applicable): One sentence explaining what has gone wrong.
* Message (if applicable): Confirmation client has been deleted.


## PUT /clients/:token
__Description:__ Updates the data of a client.

__Parameters:__
* token (in route): Token identifying the client
* DeliveryDetails: Object containing information about VAPID push notification delivery
    * endpoint
    * keys
        * auth
        * p256dh
* Name (optional): View name for this client. Won't be programmatically evaluated. Maximum supported length is 50 characters.   

__Returns:__
* Error (if applicable): One sentence explaining what has gone wrong.
* Message (if applicable): Confirmation client has been updated.

__Remarks:__
There can't exist two clients with the same DeliveryDetails, as this would result in double notifications. Trying to update the DeliveryDetails of a client to the DeliveryDetails of another client will result in a database error, as the uniqueness of the DeliveryDetails is not checked before being passed to the database for performance reasons.


## POST /subscriptions/
__Description:__ Creates a new subscription for a push channel.

__Accepted content type:__ application/json

__Parameters:__
* ChannelName: Name of the target push channel
* ClientToken: Token of the client, which will get the push notifications of this subscription
* ChannelSubscriptionSecret (if applicable): Secret as authentication for subscribing to the push channel. Can be nonexistent or up to 40 characters, just as configured upon channel creation.

__Returns:__
* Error (if applicable): One sentence explaining what has gone wrong.
* Message (if applicable): Confirmation subscription has been created (or already exists).
* SubscriptionToken (if applicable): Token, which can be used to delete this subscription.

__Remarks:__
* If the endpoint already subscribed the channel, no new subscription will be created, but the SubscriptionToken of the existing subscription will be returned.
* As confirmation and for testing purposes, a push notification will be sent to the configured endpoint.


## DELETE /subscriptions/:token
__Description:__ Deletes a subscription.

__Parameters:__ 
* token (in route): Token identifying the subscription

__Returns:__
* Error (if applicable): One sentence explaining what has gone wrong.
* Message (if applicable): Confirmation subscription has been deleted.