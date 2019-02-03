# API endpoints

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
* Name: Desired name of the new push channel. Will also be used to uniquely identify the channel on the server. Maximum length is 100 characters. If a channel with same name already exists, channel creation will fail.
* ChannelCreationSecret: Secret configured in app.config.js in order to prove to be authorized to create new channels.
* SubscriptionSecret (optional): Desired secret, which will be needed to subscribe to the channel. If not provided, created channel can be subscribed without any authentication. Maximum length is 40 characters.
* IconUrl (optional): URL of any image, which will be shown in push channels postet to the channel. If not provided, no icon will be shown. Maximum length is 100 characters.

__Returns:__
* Error (if applicable): One sentence explaining what has gone wrong.
* Message (if applicable): Confirmation for channel creation, if no error has occurred.
* PushSecret (if applicable): Secret, which will be needed in order to push messages to the channel.


## POST /channels/:name/push
__Description:__ Sends a message into a push channel.

__Accepted content type:__ application/json

__Parameters:__
* name (in route): Name of the target push channel.
* MessageContent: Content of the push notification.
* MessageTitle: Title of the push notification.
* PushSecret: Secret in order to prove to be authorized to push to this channel.

__Returns:__
* Error (if applicable): One sentence explaining what has gone wrong.
* Message (if applicable): Confirmation for notifications have been sent.


## DELETE /channels/:name
__Description:__ Deletes a push channel.

__Parameters:__
* name (in route): Name of the target push channel
* ChannelCreationSecret: Secret configured in app.config.js in order to prove to be authorized to delete channels.

__Returns:__
* Error (if applicable): One sentence explaining what has gone wrong.
* Message (if applicable): Confirmation channel has been deleted.


## POST /subscriptions/
__Description:__ Creates a new subscription for a push channel.

__Accepted content type:__ application/json

__Parameters:__
* ChannelName: Name of the target push channel
* DeliveryDetails: Object containing information about VAPID push notification delivery
    * endpoint
    * keys
        * auth
        * p256dh
* ChannelSubscriptionSecret (if applicable): Secret as authentication for subscribing to the push channel. Can be nonexistent or up to 40 characters, just as configured upon channel creation.
* Name (optional): View name for this subscription. Won't be programmatically evaluated. Maximum supported length is 100 characters.

__Returns:__
* Error (if applicable): One sentence explaining what has gone wrong.
* Message (if applicable): Confirmation subscription has been created.
* SubscriptionToken (if applicable): Token, which can be used to delete this subscription.

__Remarks:__
* If the endpoint already subscribed the channel, no new subscription will be created, as this would result in duplicate notifications.
* As confirmation and for testing purposes, a push notification will be sent to the configured endpoint.


## DELETE /subscriptions/:token
__Description:__ Deletes a subscription.

__Parameters:__ 
* token (in route): Token identifying the subscription

__Returns:__
* Error (if applicable): One sentence explaining what has gone wrong.
* Message (if applicable): Confirmation subscription has been deleted.


## PUT /subscriptions/:token
__Description:__ Updates the delivery details of a subscription.

__Parameters:__
* token (in route): Token identifying the subscription
* DeliveryDetails: Object containing updated information about VAPID push notification delivery
    * endpoint
    * keys
        * auth
        * p256dh

__Returns:__
* Error (if applicable): One sentence explaining what has gone wrong.
* Message (if applicable): Confirmation subscription has been updated.