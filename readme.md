# SelfD ![maybe dogfood ready badge](https://img.shields.io/badge/dogfood_ready-maybe-yellow)

statsd for urself

sometimes you just want to monitor some of those small one-off statistics and do so in a low friction way (e.g. "how many times did I see the old style tram on this line" or "what level of headache am i currently experiencing" or "please track my stool consistency") that one usually has to make a google form, for. And then you have to make graphs and it's a whole thing and you just wish it was more automatic.

## The idea

Add keys like 'trams/4/old' and 'trams/4/new' and then you can just tap those entries to increment them when you want to record a data point. We'll provide some graphing somehow based on your keys.

## data model (aka notes for myself)

counters:
 - simple (+1), implemented! e.g. how many times you saw a specific tram
 - complex (+N), requires a popup. e.g. beverage tracking

gauge:
- (±N), not sure what you'd use this for, lemme know if u dear reader have ideas

timers:
- wouldn't be hard to implement? just store an interval, if it's open it's running. if closed then done. could be useful?

## known use cases / key structuring ideas

- alc/12% - counter, increase in mL (should we store a unit?)
- bristol/{1..7} - simple counter
- tram/{old,new}/{1,2,3...}
- pain/head - [0,5) - personally use fractions here, maybe this is a gauge? but non filled values here generally aren't meaningful? here subkeys to subtype left/right/migraine would be useful, and then aggregating those in graphs 
- pain/knee/{left,right} should we render 0/1 as bools?
- MH/anxiety - gauge
- MH/SH(I) - counter


this isn't envisioned to bring in external data at all, so, not sure i have any use cases for timers? could use it for periods ig.

it'll be relatively automation free ofc.

## todo

- [x] units
- [x] gauge, timer
- [x] +N dialog
- [x] version the data even if not supporting migrations yet
- [x] a11y testing (esp for mutable values, dialogs)
- [ ] error checking (null names)
- [ ] validate gauge entry
- [ ] suggest using /
- [ ] compact mode, only buttons + inputs with small (+) button
- [ ] bulk add with templating
- [ ] remove values
- [ ] sort table by key name
- [ ] padding on export import buttons
- [ ] settings dialogue? (compact mode, non 90s theme?)
- [ ] undo!!!
- [ ] graphs

## graphing plan

by default everything, let folks drill down by one or more keys in case they didn't organise well. minimal UI.
zoom?

also want a calendar view

## sync story

there is one now! please run one yourself. See `cgi-bin/store.py` for an example implementation. It is recommended to run it yourself on your tailscale or so.

## LICENSE

AGPL-3.0-or-later
