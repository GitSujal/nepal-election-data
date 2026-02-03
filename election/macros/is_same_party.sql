{#
    Macro to check if two party names refer to the same party, considering:
    1. Direct name equality
    2. Party mergers and renames (via dim_parties.previous_names)
    3. Normalized name matching for spelling variations

    Returns:
    - NULL if either party name is null
    - TRUE if the parties are the same (including after merger/rename)
    - FALSE otherwise

    Usage:
        {{ is_same_party('current_party_name', 'prev_party_name') }}
        {{ is_same_party(adapter.quote("PoliticalPartyName"), 'pr.' ~ adapter.quote("PoliticalPartyName")) }}
#}

{% macro is_same_party(party_name_1, party_name_2) %}
case
    when {{ party_name_1 }} is null or {{ party_name_2 }} is null then null
    when {{ party_name_1 }} = {{ party_name_2 }} then true
    when exists (
        select 1
        from {{ ref('dim_parties') }} _dp
        where (
            _dp.current_party_name = {{ party_name_1 }}
            or list_contains(_dp.previous_names, {{ party_name_1 }})
            or _dp.norm_name = {{ sanitize_party_name(party_name_1) }}
            or list_contains(_dp.norm_previous_names, {{ sanitize_party_name(party_name_1) }})
        )
        and (
            _dp.current_party_name = {{ party_name_2 }}
            or list_contains(_dp.previous_names, {{ party_name_2 }})
            or _dp.norm_name = {{ sanitize_party_name(party_name_2) }}
            or list_contains(_dp.norm_previous_names, {{ sanitize_party_name(party_name_2) }})
        )
    ) then true
    else false
end
{% endmacro %}
