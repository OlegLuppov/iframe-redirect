/**Провайдер */
const PROVIDER = '5fa49fe1-b5ab-4353-8980-729359f30a30'

const boot = () => {
	registerEventsHandler()
	sendCodeRequest()
}

const registerEventsHandler = () => {
	window.addEventListener('message', (event) => {
		if (event.data.type === authCodeResponse.type && event.data.data?.code) {
			console.log('code', event.data.data?.code)
			redirectByCode(event.data.data.code)
		} else if (event.data.type === authCodeError.type) {
			const errorText = 'Ошибка авторизации: ' + (event.data.error?.message || 'Неизвестная ошибка')
			console.error(errorText)

			throw new Error(errorText)
		}
	})
}

const sendCodeRequest = () => {
	messageToParent(initRequest)
	messageToParent(authCodeRequest)
}

const messageToParent = (data) => {
	const parentOrigin = '*'
	window.frames.parent.postMessage(JSON.stringify(data), parentOrigin)
}

const redirectByCode = (code) => {
	const authState = 'auth-new'
	sessionStorage.setItem(
		'login:oauth2:5fa49fe1-b5ab-4353-8980-729359f30a30',
		JSON.stringify({ expires: Date.now() + 180000 })
	)
	const url = `/_oauth2/post-message?provider=${PROVIDER}&scope=email.read+phone.read&state=at_iframe-test&code=${code}&at_iframe=true`

	window.history.pushState(authState, '', url)

	window.history.go(authState)
}

const initRequest = {
	type: 'LifeMiniAppInit',
	data: {},
	requestId: 1,
}

const authCodeRequest = {
	type: 'LifeMiniAppAuthCode',
	data: {},
	requestId: 2,
}

const authCodeResponse = {
	type: 'LifeMiniAppAuthCodeResult',
	data: {
		code: '<auth-code>',
	},
	requestId: 2,
}

const authCodeError = {
	type: 'LifeMiniAppAuthCodeFailed',
	data: {
		error: {
			code: 3,
			message: 'Error message',
		},
	},
	requestId: 2,
}

function startBoot() {
	document.addEventListener('DOMContentLoaded', boot)
}

startBoot()
