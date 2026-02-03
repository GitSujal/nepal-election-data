{#
    Macro to sanitize/normalize party names for matching across datasets.

    Steps:
    1. Remove spaces
    2. Remove hyphens
    3. Remove parentheses
    4. Normalize Congress (काङ्ग्रेस → काँग्रेस)
    5. Normalize Marxist (माक्र्सवादी → मार्क्सवादी)
    6. Convert to lowercase
    7. Remove all Devanagari diacritics

    Usage:
        {{ sanitize_party_name('column_name') }}
        {{ sanitize_party_name(adapter.quote("PoliticalPartyName")) }}
#}

{% macro sanitize_party_name(column_expr) %}
regexp_replace(
    lower(trim(replace(replace(replace(replace(replace(replace(
        {{ column_expr }},
        ' ', ''),
        '-', ''),
        '(', ''),
        ')', ''),
        'काङ्ग्रेस', 'काँग्रेस'),
        'माक्र्सवादी', 'मार्क्सवादी')
    )),
    '[ािीुूेैोौ्ंँ़]', '', 'g'
)
{% endmacro %}
