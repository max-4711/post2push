##Routen:
###POST /subscriptions
-> Channel-Name, ggfs. Channel-Subscription-Secret, Push-Provider-Token, Subscription-Anzeigename (optional)
<- Subscription-Token

###DELETE /subscriptions/<Token>
-> Subscription-Token

###POST /channels 
-> gewünschter Channel-Name, Channel-Creation-Secret, gewünschtes Channel-Subscription-Secret (optional)

###POST /channels/<name>/push
-> Channel-Name, Channel-Push-Secret, Nachricht, Titel
<- Anzahl Empfänger?

###DELETE /channels/<name>
-> Channel-Name, Channel-Push-Secret


##Datenbank:

###Serverconfig (Datenbank oder Datei?)
Channel-Creation-Secret

###Channel
Name (string/PK), Push-Secret (string), Creation-Timestamp (datetime), Last-Push-Timestamp (datetime), ?Subscription-Secret (string)

###Subscription
Token (string/PK), Channelname (string/FK), Creation-Timestamp (datetime), Push-Token (string)
