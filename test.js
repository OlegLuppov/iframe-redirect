// Как оно должно работать?
// Принцип работы и пример в функции boot
// старт работы
// при вызове отправляет данные для авторизации в TN и редиректит с кодом в элму для завершения авторизации.
// функцию необходимо вызывать после готовности dom
const boot = () => {
 // добавляем обработчик соообщений, что бы увидеть код, в идеале, необходим, обработчик возвращающий значения
 // сейчас полу-ручной режим
 registerEventsHandler()
 // Отправляем запросы на получения кода.
 // В идеале если все ок, в консоли увидим код, его копируем и вставляем для вызова функции.
 sendCodeRequest()
}

const registerEventsHandler = () => {
 // Регистрация обработчика полученных post-message
 window.addEventListener('message', (event) => {
  console.log(event.data)
  if (event.data.type === authCodeResponse.type && event.data.data?.code) {
   console.log('код авторизации:', event.data.data?.code)
   // при успешной аутентификации продвигаемся дальше и пробуем пройти аутентификацию полностью.
   // в урле пока хардкод параметров пользователя.
   redirectByCode(event.data.data.code)
  } else if (event.data.type === authCodeError.type) {
   const errorText = 'Ошибка авторизации: ' + (event.data.error?.message || 'Неизвестная ошибка')
   console.error(errorText)

   throw new Error(errorText)
  }
 })
}

// Дефолтный флоу авторизации TN
const sendCodeRequest = () => {
 // инит
 messageToParent(initRequest)
 // запрос кода
 messageToParent(authCodeRequest)
}

const messageToParent = (data) => {
 // * - любой origin, лучше выставлять конкретный домен.
 const parentOrigin = '*'
 window.frames.parent.postMessage(JSON.stringify(data), parentOrigin)
}

const redirectByCode = (code) => {
 const authState = 'auth-new'
 // установка сессии, что она не истекла и юзер хотел пройти авторизацию.
 // шаблон ключа: login:oauth2: - константа, а 5fa49fe1-b5ab-4353-8980-729359f30a30 - идентификатор провайдера "Интеграция с ЦП"
 // 2 аргумент - это время жизни, которое требуется сессии.
 sessionStorage.setItem(
  'login:oauth2:5fa49fe1-b5ab-4353-8980-729359f30a30',
  JSON.stringify({ expires: Date.now() + 180000 })
 )
 // переход на страницу проверки урла
 // provider - ид модуля для авторизации oauth2 "Интеграция с ЦП"
 // scope - доступ к данным пользователя, задается например через конфигурацию или хардкод константой
 // state - служебная форма для управления флоу авторизации в элме at_iframe - обозначение, что мы проходим авторизацию в фрейме
 // code - код полученный в флоу авторизации TN
 // Генерируем новый стейт для перехода по ссылке
 console.log(code)
 const url = `/_oauth2/post-message?provider=5fa49fe1-b5ab-4353-8980-729359f30a30&scope=email.read+phone.read&state=at_iframe&code=${code}&at_iframe=true`
 window.history.pushState(authState, '', url)
 // переход по стейту
 window.history.go(authState)
}

// Запрос, чтобы TN Life зарегистрировал инициализацию мини-приложения (скрыл Splash-экран)
const initRequest = {
 type: 'LifeMiniAppInit',
 data: {},
 requestId: 1,
}

// Запрос для получения кода авторизации
const authCodeRequest = {
 type: 'LifeMiniAppAuthCode',
 data: {},
 requestId: 2,
}
// Формат ответа от TN Life с кодом авторизации
const authCodeResponse = {
 type: 'LifeMiniAppAuthCodeResult',
 data: {
  code: '<auth-code>',
 },
 requestId: 2,
}
// Формат ошибки от TN Life при получении кода авторизации
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

document.addEventListener('DOMContentLoaded', boot)
