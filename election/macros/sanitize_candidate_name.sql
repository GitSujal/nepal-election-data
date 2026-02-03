{#
    Macro to sanitize/normalize candidate names for cross-term and cross-dataset matching.

    Steps:
    1. Remove ZWJ/ZWNJ characters (chr(8205), chr(8204))
    2. Remove content in brackets: (), {}, []
    3. Remove spaces, dots, non-breaking spaces
    4. Remove title prefixes (डा, डा०, कु, श्री)
    5. Remove Nepali numerals and danda
    6. Normalize Devanagari vowels and common spelling variations

    Usage:
        {{ sanitize_candidate_name('column_name') }}
        {{ sanitize_candidate_name(adapter.quote("CandidateName")) }}
#}

{% macro sanitize_candidate_name(column_expr) %}
replace(replace(replace(replace(replace(replace(replace(
    regexp_replace(
        regexp_replace(
            regexp_replace(
                regexp_replace(
                    replace(replace({{ column_expr }}, chr(8205), ''), chr(8204), ''),
                    '\{[^}]*\}|\([^)]*\)|\[[^\]]*\]', '', 'g'
                ),
                '[\s\.\x{00a0}]+', '', 'g'
            ),
            '^(डा॰?|डा०?|कु\.|श्री\.?)', ''
        ),
        '[०-९।]+', '', 'g'
    ),
'ी', 'ि'), 'ू', 'ु'), 'ँ', 'ं'), 'ङ्ग', 'ङ'), 'ट्ट', 'ट'), 'व', 'ब'), 'ण', 'न')
{% endmacro %}
