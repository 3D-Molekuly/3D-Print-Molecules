import { init, addMessages } from 'svelte-i18n'
import { defaultLocale, detectClientLocale } from '$lib/functions/language'
import en from '../translations/en.json'
import cs from '../translations/cs.json'
import de from '../translations/de.json'
import fr from '../translations/fr.json'
import es from '../translations/es.json'
import pt from '../translations/pt.json'

addMessages('en', en)
addMessages('cs', cs)
addMessages('de', de)
addMessages('fr', fr)
addMessages('es', es)
addMessages('pt', pt)

init({
	fallbackLocale: defaultLocale,
	initialLocale: detectClientLocale(),
})
