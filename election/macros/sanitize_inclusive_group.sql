{#
    Macro to sanitize/normalize inclusive group names for consistent categorization.

    Handles common spelling variations and diacritical mark differences:
    - खस आय/आये/आयै/आर्य → खस आर्य (Khas Arya)
    - थार/थारु → थारु (Tharu)
    - मधेशी/मध्यशी/मध्येशी/मध्येशो → मधेशी (Madhesi)

    Usage:
        {{ sanitize_inclusive_group('column_name') }}
        {{ sanitize_inclusive_group(adapter.quote("InclusiveGroup")) }}
#}

{% macro sanitize_inclusive_group(column_expr) %}
case
    when {{ column_expr }} is null or trim({{ column_expr }}) = '' then null
    else lower(trim(
        case
            when lower(trim({{ column_expr }})) in ('खस आय', 'खस आये', 'खस आयै', 'खस आर्य') then 'खस आर्य'
            when lower(trim({{ column_expr }})) in ('थार', 'थारु') then 'थारु'
            when lower(trim({{ column_expr }})) in ('मधेशी', 'मध्यशी', 'मध्येशी', 'मध्येशो') then 'मधेशी'
            else {{ column_expr }}
        end
    ))
end
{% endmacro %}
