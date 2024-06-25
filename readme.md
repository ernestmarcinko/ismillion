# IsMillion
Very powerful package to check if a number is one million.

```shell
npm install is-million
```

```javascript
import isMillion from "is-million";

if ( isMillion(1000000) ) {
	console.log('It is one million.');
}

if ( isMillion(1000001) ) {
	console.log('It is not one million.');
}
```