##Routen:

###POST /create 
-> gewünschter Channel-Name, Channel-Creation-Secret, gewünschtes Channel-Subscription-Secret (optional)
<- Channel-Name, Channel-Push-Secret und ggfs. Channel-Subscription-Secret

###POST /subscribe
-> Channel-Name, ggfs. Channel-Subscription-Secret, Push-Token?, ???
<- Subscription-Token, ggfs. Channel-Subscription-Secret

###DELETE /subscription
-> Channel-Name, Subscription-Token

###POST /push
-> Channel-Name, Channel-Push-Secret, Nachricht
<- Anzahl Empfänger?

###DELETE /channel
-> Channel-Name, Channel-Push-Secret


##Datenbank:

###Serverconfig (Datenbank oder Datei?)
Channel-Creation-Secret

###Channel
Name (string/PK), Push-Secret (string), Creation-Timestamp (datetime), Last-Push-Timestamp (datetime), ?Subscription-Secret (string)

###Subscription
Token (string/PK), Channelname (string/FK), Creation-Timestamp (datetime), Push-Token (string)
