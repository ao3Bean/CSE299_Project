from django import template

register = template.Library()

CARD_COLOURS = ['orange', 'coral', 'blue', 'light-blue', 'green']

@register.filter
def card_colour(index):
    return CARD_COLOURS[index % len(CARD_COLOURS)]