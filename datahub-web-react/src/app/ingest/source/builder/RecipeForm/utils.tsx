import React from 'react';
import { set, get } from 'lodash';
import { SNOWFLAKE } from '../../conf/snowflake/snowflake';
import { BIGQUERY } from '../../conf/bigquery/bigquery';
import { REDSHIFT } from '../../conf/redshift/redshift';

export enum FieldType {
    TEXT,
    BOOLEAN,
    LIST,
    SELECT,
}

interface Option {
    label: string;
    value: string;
}

export interface RecipeField {
    name: string;
    label: string;
    tooltip: string | React.ReactNode;
    type: FieldType;
    fieldPath: string;
    rules: any[] | null;
    section?: string;
    options?: Option[];
    getValueFromRecipeOverride?: (recipe: any) => any;
    setValueOnRecipeOverride?: (recipe: any, value: any) => any;
}

function clearFieldAndParents(recipe: any, fieldPath: string) {
    set(recipe, fieldPath, undefined);

    const updatedFieldPath = fieldPath.split('.').slice(0, -1).join('.'); // remove last item from fieldPath
    if (updatedFieldPath) {
        const parentKeys = Object.keys(get(recipe, updatedFieldPath));

        // only child left is what we just set as undefined
        if (parentKeys.length === 1) {
            clearFieldAndParents(recipe, updatedFieldPath);
        }
    }
    return recipe;
}

export function setFieldValueOnRecipe(recipe: any, value: any, fieldPath: string) {
    const updatedRecipe = { ...recipe };
    if (value !== undefined) {
        if (value === null) {
            clearFieldAndParents(updatedRecipe, fieldPath);
            return updatedRecipe;
        }
        set(updatedRecipe, fieldPath, value);
    }
    return updatedRecipe;
}

export function setListValuesOnRecipe(recipe: any, values: string[] | undefined, fieldPath: string) {
    const updatedRecipe = { ...recipe };
    if (values !== undefined) {
        const filteredValues: string[] | undefined = values.filter((v) => !!v);
        return filteredValues.length
            ? setFieldValueOnRecipe(updatedRecipe, filteredValues, fieldPath)
            : setFieldValueOnRecipe(updatedRecipe, null, fieldPath);
    }
    return updatedRecipe;
}

export const SNOWFLAKE_ACCOUNT_ID: RecipeField = {
    name: 'account_id',
    label: 'Account ID',
    tooltip: 'Snowflake account. e.g. abc48144',
    type: FieldType.TEXT,
    fieldPath: 'source.config.account_id',
    rules: null,
};

export const SNOWFLAKE_WAREHOUSE: RecipeField = {
    name: 'warehouse',
    label: 'Warehouse',
    tooltip: 'Snowflake warehouse.',
    type: FieldType.TEXT,
    fieldPath: 'source.config.warehouse',
    rules: null,
};

export const SNOWFLAKE_USERNAME: RecipeField = {
    name: 'username',
    label: 'Username',
    tooltip: 'Snowflake username.',
    type: FieldType.TEXT,
    fieldPath: 'source.config.username',
    rules: null,
};

export const SNOWFLAKE_PASSWORD: RecipeField = {
    name: 'password',
    label: 'Password',
    tooltip: 'Snowflake password.',
    type: FieldType.TEXT,
    fieldPath: 'source.config.password',
    rules: null,
};

export const SNOWFLAKE_ROLE: RecipeField = {
    name: 'role',
    label: 'Role',
    tooltip: 'Snowflake role.',
    type: FieldType.TEXT,
    fieldPath: 'source.config.role',
    rules: null,
};

export const BIGQUERY_PROJECT_ID: RecipeField = {
    name: 'project_id',
    label: 'BigQuery Project ID',
    tooltip: 'Project ID where you have rights to run queries and create tables.',
    type: FieldType.TEXT,
    fieldPath: 'source.config.project_id',
    rules: null,
};

export const BIGQUERY_CREDENTIAL_PROJECT_ID: RecipeField = {
    name: 'credential.project_id',
    label: 'Credentials Project ID',
    tooltip: 'Project id to set the credentials.',
    type: FieldType.TEXT,
    fieldPath: 'source.config.credential.project_id',
    rules: null,
};

export const BIGQUERY_PRIVATE_KEY_ID: RecipeField = {
    name: 'credential.private_key_id',
    label: 'Private Key Id',
    tooltip: 'Private key id.',
    type: FieldType.TEXT,
    fieldPath: 'source.config.credential.private_key_id',
    rules: null,
};

export const BIGQUERY_PRIVATE_KEY: RecipeField = {
    name: 'credential.private_key',
    label: 'Private Key',
    tooltip: 'Private key in a form of "-----BEGIN PRIVATE KEY-----\nprivate-key\n-----END PRIVATE KEY-----\n".',
    type: FieldType.TEXT,
    fieldPath: 'source.config.credential.private_key',
    rules: null,
};

export const BIGQUERY_CLIENT_EMAIL: RecipeField = {
    name: 'credential.client_email',
    label: 'Client Email',
    tooltip: 'Client email.',
    type: FieldType.TEXT,
    fieldPath: 'source.config.credential.client_email',
    rules: null,
};

export const BIGQUERY_CLIENT_ID: RecipeField = {
    name: 'credential.client_id',
    label: 'Client ID',
    tooltip: 'Client ID.',
    type: FieldType.TEXT,
    fieldPath: 'source.config.credential.client_id',
    rules: null,
};

export const REDSHIFT_HOST_PORT: RecipeField = {
    name: 'host_port',
    label: 'Host Port',
    tooltip: 'Host URL.',
    type: FieldType.TEXT,
    fieldPath: 'source.config.host_port',
    rules: null,
};

export const REDSHIFT_DATABASE: RecipeField = {
    name: 'database',
    label: 'Database',
    tooltip: 'Database (catalog).',
    type: FieldType.TEXT,
    fieldPath: 'source.config.database',
    rules: null,
};

export const REDSHIFT_USERNAME: RecipeField = {
    name: 'redshift.username',
    label: 'Redshift username',
    tooltip: 'Username',
    type: FieldType.TEXT,
    fieldPath: 'source.config.username',
    rules: null,
};

export const REDSHIFT_PASSWORD: RecipeField = {
    name: 'redshift.password',
    label: 'Redshift password',
    tooltip: 'Password',
    type: FieldType.TEXT,
    fieldPath: 'source.config.password',
    rules: null,
};

const includeLineageFieldPathA = 'source.config.include_table_lineage';
const includeLineageFieldPathB = 'source.config.include_view_lineage';
export const INCLUDE_LINEAGE: RecipeField = {
    name: 'include_lineage',
    label: 'Include Lineage',
    tooltip: 'Include Table and View lineage in your ingestion.',
    type: FieldType.BOOLEAN,
    fieldPath: 'source.config.include_table_lineage',
    rules: null,
    getValueFromRecipeOverride: (recipe: any) =>
        get(recipe, includeLineageFieldPathA) && get(recipe, includeLineageFieldPathB),
    setValueOnRecipeOverride: (recipe: any, value: boolean) => {
        let updatedRecipe = setFieldValueOnRecipe(recipe, value, includeLineageFieldPathA);
        updatedRecipe = setFieldValueOnRecipe(updatedRecipe, value, includeLineageFieldPathB);
        return updatedRecipe;
    },
};

export const IGNORE_START_TIME_LINEAGE: RecipeField = {
    name: 'ignore_start_time_lineage',
    label: 'Ignore Start Time Lineage',
    tooltip: 'Get all lineage by ignoring the start_time field. It is suggested to set to true initially.',
    type: FieldType.BOOLEAN,
    fieldPath: 'source.config.ignore_start_time_lineage',
    rules: null,
};

export const CHECK_ROLE_GRANTS: RecipeField = {
    name: 'check_role_grants',
    label: 'Check Role Grants',
    tooltip:
        'If set to True then checks role grants at the beginning of the ingestion run. To be used for debugging purposes. If you think everything is working fine then set it to False. In some cases this can take long depending on how many roles you might have.',
    type: FieldType.BOOLEAN,
    fieldPath: 'source.config.check_role_grants',
    rules: null,
};

export const PROFILING_ENABLED: RecipeField = {
    name: 'profiling.enabled',
    label: 'Enable Profiling',
    tooltip: 'Whether profiling should be done.',
    type: FieldType.BOOLEAN,
    fieldPath: 'source.config.profiling.enabled',
    rules: null,
};

export const STATEFUL_INGESTION_ENABLED: RecipeField = {
    name: 'stateful_ingestion.enabled',
    label: 'Enable Stateful Ingestion',
    tooltip: 'Enable the type of the ingestion state provider registered with datahub.',
    type: FieldType.BOOLEAN,
    fieldPath: 'source.config.stateful_ingestion.enabled',
    rules: null,
};

export const UPSTREAM_LINEAGE_IN_REPORT: RecipeField = {
    name: 'upstream_lineage_in_report',
    label: 'Include Upstream Lineage In Report.',
    tooltip: 'Useful for debugging lineage information. Set to True to see the raw lineage created internally.',
    type: FieldType.BOOLEAN,
    fieldPath: 'source.config.upstream_lineage_in_report',
    rules: null,
};

const TableLineageModeTooltip = () => {
    return (
        <div>
            <p>
                Which table lineage collector mode to use. Check out{' '}
                <a
                    href="https://datahubproject.io/docs/generated/ingestion/sources/redshift/#config-details"
                    target="_blank"
                    rel="noreferrer"
                >
                    the documentation
                </a>{' '}
                explaining the difference between the three available modes.
            </p>
        </div>
    );
};

export const TABLE_LINEAGE_MODE: RecipeField = {
    name: 'table_lineage_mode',
    label: 'Table Lineage Mode',
    tooltip: TableLineageModeTooltip,
    type: FieldType.SELECT,
    fieldPath: 'source.config.table_lineage_mode',
    rules: null,
    options: [
        { label: 'stl_scan_based', value: 'stl_scan_based' },
        { label: 'sql_based', value: 'sql_based' },
        { label: 'mixed', value: 'mixed' },
    ],
};

const databaseAllowFieldPath = 'source.config.database_pattern.allow';
export const DATABASE_ALLOW: RecipeField = {
    name: 'database_pattern.allow',
    label: 'Allow Patterns',
    tooltip: 'Use regex here.',
    type: FieldType.LIST,
    fieldPath: 'source.config.database_pattern.allow',
    rules: null,
    section: 'Databases',
    setValueOnRecipeOverride: (recipe: any, values: string[]) =>
        setListValuesOnRecipe(recipe, values, databaseAllowFieldPath),
};

const databaseDenyFieldPath = 'source.config.database_pattern.deny';
export const DATABASE_DENY: RecipeField = {
    name: 'database_pattern.deny',
    label: 'Deny Patterns',
    tooltip: 'Use regex here.',
    type: FieldType.LIST,
    fieldPath: 'source.config.database_pattern.deny',
    rules: null,
    section: 'Databases',
    setValueOnRecipeOverride: (recipe: any, values: string[]) =>
        setListValuesOnRecipe(recipe, values, databaseDenyFieldPath),
};

const schemaAllowFieldPath = 'source.config.schema_pattern.allow';
export const SCHEMA_ALLOW: RecipeField = {
    name: 'schema_pattern.allow',
    label: 'Allow Patterns',
    tooltip: 'Use regex here.',
    type: FieldType.LIST,
    fieldPath: 'source.config.schema_pattern.allow',
    rules: null,
    section: 'Schemas',
    setValueOnRecipeOverride: (recipe: any, values: string[]) =>
        setListValuesOnRecipe(recipe, values, schemaAllowFieldPath),
};

const schemaDenyFieldPath = 'source.config.schema_pattern.deny';
export const SCHEMA_DENY: RecipeField = {
    name: 'schema_pattern.deny',
    label: 'Deny Patterns',
    tooltip: 'Use regex here.',
    type: FieldType.LIST,
    fieldPath: 'source.config.schema_pattern.deny',
    rules: null,
    section: 'Schemas',
    setValueOnRecipeOverride: (recipe: any, values: string[]) =>
        setListValuesOnRecipe(recipe, values, schemaDenyFieldPath),
};

const viewAllowFieldPath = 'source.config.view_pattern.allow';
export const VIEW_ALLOW: RecipeField = {
    name: 'view_pattern.allow',
    label: 'Allow Patterns',
    tooltip: 'Use regex here.',
    type: FieldType.LIST,
    fieldPath: 'source.config.view_pattern.allow',
    rules: null,
    section: 'Views',
    setValueOnRecipeOverride: (recipe: any, values: string[]) =>
        setListValuesOnRecipe(recipe, values, viewAllowFieldPath),
};

const viewDenyFieldPath = 'source.config.view_pattern.deny';
export const VIEW_DENY: RecipeField = {
    name: 'view_pattern.deny',
    label: 'Deny Patterns',
    tooltip: 'Use regex here.',
    type: FieldType.LIST,
    fieldPath: 'source.config.view_pattern.deny',
    rules: null,
    section: 'Views',
    setValueOnRecipeOverride: (recipe: any, values: string[]) =>
        setListValuesOnRecipe(recipe, values, viewDenyFieldPath),
};

const tableAllowFieldPath = 'source.config.table_pattern.allow';
export const TABLE_ALLOW: RecipeField = {
    name: 'table_pattern.allow',
    label: 'Allow Patterns',
    tooltip: 'Use regex here.',
    type: FieldType.LIST,
    fieldPath: 'source.config.table_pattern.allow',
    rules: null,
    section: 'Tables',
    setValueOnRecipeOverride: (recipe: any, values: string[]) =>
        setListValuesOnRecipe(recipe, values, tableAllowFieldPath),
};

const tableDenyFieldPath = 'source.config.table_pattern.deny';
export const TABLE_DENY: RecipeField = {
    name: 'table_pattern.deny',
    label: 'Deny Patterns',
    tooltip: 'Use regex here.',
    type: FieldType.LIST,
    fieldPath: 'source.config.table_pattern.deny',
    rules: null,
    section: 'Tables',
    setValueOnRecipeOverride: (recipe: any, values: string[]) =>
        setListValuesOnRecipe(recipe, values, tableDenyFieldPath),
};

export const RECIPE_FIELDS = {
    [SNOWFLAKE]: {
        fields: [SNOWFLAKE_ACCOUNT_ID, SNOWFLAKE_WAREHOUSE, SNOWFLAKE_USERNAME, SNOWFLAKE_PASSWORD, SNOWFLAKE_ROLE],
        advancedFields: [
            INCLUDE_LINEAGE,
            IGNORE_START_TIME_LINEAGE,
            CHECK_ROLE_GRANTS,
            PROFILING_ENABLED,
            STATEFUL_INGESTION_ENABLED,
        ],
        filterFields: [
            TABLE_ALLOW,
            TABLE_DENY,
            DATABASE_ALLOW,
            DATABASE_DENY,
            SCHEMA_ALLOW,
            SCHEMA_DENY,
            VIEW_ALLOW,
            VIEW_DENY,
        ],
    },
    [BIGQUERY]: {
        fields: [
            BIGQUERY_PROJECT_ID,
            BIGQUERY_CREDENTIAL_PROJECT_ID,
            BIGQUERY_PRIVATE_KEY,
            BIGQUERY_PRIVATE_KEY_ID,
            BIGQUERY_CLIENT_EMAIL,
            BIGQUERY_CLIENT_ID,
        ],
        advancedFields: [INCLUDE_LINEAGE, PROFILING_ENABLED, STATEFUL_INGESTION_ENABLED, UPSTREAM_LINEAGE_IN_REPORT],
        filterFields: [TABLE_ALLOW, TABLE_DENY, SCHEMA_ALLOW, SCHEMA_DENY, VIEW_ALLOW, VIEW_DENY],
    },
    [REDSHIFT]: {
        fields: [REDSHIFT_HOST_PORT, REDSHIFT_DATABASE, REDSHIFT_USERNAME, REDSHIFT_PASSWORD],
        advancedFields: [INCLUDE_LINEAGE, PROFILING_ENABLED, STATEFUL_INGESTION_ENABLED, TABLE_LINEAGE_MODE],
        filterFields: [TABLE_ALLOW, TABLE_DENY, SCHEMA_ALLOW, SCHEMA_DENY, VIEW_ALLOW, VIEW_DENY],
    },
};

export const CONNECTORS_WITH_FORM = new Set(Object.keys(RECIPE_FIELDS));
