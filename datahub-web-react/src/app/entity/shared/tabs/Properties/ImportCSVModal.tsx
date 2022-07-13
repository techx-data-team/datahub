import React, { useState } from 'react';
import { message, Button, Modal } from 'antd';
import MD5 from 'crypto-js/md5';
import md5ToUuid from 'md5-to-uuid';
// import styled from 'styled-components/macro';
// import { useUpdateCustomPropertiesMutation } from '../../../../../graphql/mutations.generated';
// import { StringMapEntryInput } from '../../../../../types.generated';
import { EntityType } from '../../../../../types.generated';
// import { useEntityRegistry } from '../../../../useEntityRegistry';
// import { useRefetch } from '../../EntityContext';
import PropertiesTermsTable, { PropertyDataType } from './PropertiesTermsTable';
import { useGetSearchResultsForMultipleQuery } from '../../../../../graphql/search.generated';
import {
    useCreateGlossaryTermMutation,
    useCreateGlossaryNodeMutation,
} from '../../../../../graphql/glossaryTerm.generated';

// import analytics, { EventType, EntityActionType } from '../../../../analytics';
interface Props {
    onClose: () => void;
}

function ImportCSVModal(props: Props) {
    const { onClose } = props;
    const customPropsInit: PropertyDataType[] = [];
    const [dataSource, setDataSource] = useState(customPropsInit);
    const [importButtonDisabled, setimportButtonDisabled] = useState(false);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    // const refetch = useRefetch();
    const [createGlossaryTermMutation] = useCreateGlossaryTermMutation();
    const [createGlossaryNodeMutation] = useCreateGlossaryNodeMutation();

    function getUUID(value: str) {
        const md5Hash = MD5(value).toString();
        const uuid = md5ToUuid(md5Hash);
        return uuid;
    }

    const { data } = useGetSearchResultsForMultipleQuery({
        variables: {
            input: {
                types: [EntityType.GlossaryTerm, EntityType.GlossaryNode],
                query: '',
                start: 0,
                count: 50,
            },
        },
        skip: !(dataSource.length === 0),
    });

    if (searchResults.length === 0) {
        const temp = data?.searchAcrossEntities?.searchResults;
        if (typeof temp === 'object') setSearchResults(temp);
    }

    function createGlossaryEntity(type: entityType, inputValue: Object) {
        const mutation =
            entityType === EntityType.GlossaryTerm ? createGlossaryTermMutation : createGlossaryNodeMutation;

        mutation({
            variables: {
                input: inputValue,
            },
        })
            .catch((e) => {
                message.destroy();
                message.error({
                    content: `Failed to create: \n ${e.message || ''}`,
                    duration: 3,
                });
            })
            .finally(() => {
                message.loading({
                    content: 'Updating ',
                    duration: 2,
                });
                setTimeout(() => {
                    message.success({
                        content: `Created ${entityRegistry.getEntityName(entityType)}!`,
                        duration: 2,
                    });
                }, 2000);
            });
    }

    function importGlossaryEntity() {
        setimportButtonDisabled(true);
        message.loading({ content: 'Saving new glossarys and terms...' });
        console.log('searchResults: ', searchResults);
        var dict = {
            GLOSSARY_TERM: {},
            GLOSSARY_NODE: {},
        };
        searchResults.forEach((e) => {
            if (e.entity.type === 'GLOSSARY_TERM') {
                dict['GLOSSARY_TERM'][e.entity.properties.name] = e.entity.urn;
            } else if (e.entity.type === 'GLOSSARY_NODE') {
                dict['GLOSSARY_NODE'][e.entity.properties.name] = e.entity.urn;
            }
        });
        var glossaryInsert = {
            GLOSSARY_TERM: {},
            GLOSSARY_NODE: {},
        };
        dataSource.forEach((e) => {
            if (e.term_gourp_1 && e.term_gourp_2 && e.term_gourp_3) {
                e['term_gourp_1_id'] = getUUID(e.term_gourp_1);
                e['term_gourp_2_id'] = getUUID(e.term_gourp_1 + e.term_gourp_2);
                e['term_gourp_3_id'] = getUUID(e.term_gourp_1 + e.term_gourp_2 + e.term_gourp_3);
                e['term_id'] = getUUID(e.term_gourp_1 + e.term_gourp_2 + e.term_gourp_3 + e.term);
                glossaryInsert['GLOSSARY_NODE'][e['term_gourp_1_id']] = {
                    id: e['term_gourp_1_id'],
                    name: e['term_gourp_1'],
                    parentNode: null,
                };
                glossaryInsert['GLOSSARY_NODE'][e['term_gourp_2_id']] = {
                    id: e['term_gourp_2_id'],
                    name: e['term_gourp_2'],
                    parentNode: 'urn:li:glossaryNode:' + e['term_gourp_1_id'],
                };
                glossaryInsert['GLOSSARY_NODE'][e['term_gourp_3_id']] = {
                    id: e['term_gourp_3_id'],
                    name: e['term_gourp_3'],
                    parentNode: 'urn:li:glossaryNode:' + e['term_gourp_2_id'],
                };
                glossaryInsert['GLOSSARY_TERM'][e['term_id']] = {
                    id: e['term_id'],
                    name: e['term'],
                    parentNode: 'urn:li:glossaryNode:' + e['term_gourp_3_id'],
                };
            }
        });
        Object.entries(glossaryInsert['GLOSSARY_NODE']).forEach(([k, v]) => {
            createGlossaryEntity(EntityType.GlossaryTerm, v);
        });

        Object.entries(glossaryInsert['GLOSSARY_TERM']).forEach(([k, v]) => {
            createGlossaryEntity(EntityType.GlossaryNode, v);
        });
        setimportButtonDisabled(false);
        // onClose();
    }

    return (
        <Modal
            title="Import Glossary Term from csv file"
            width={1000}
            visible
            onCancel={onClose}
            footer={
                <>
                    <Button onClick={onClose} type="text">
                        Cancel
                    </Button>
                    <Button onClick={importGlossaryEntity} disabled={importButtonDisabled}>
                        Import
                    </Button>
                </>
            }
        >
            <PropertiesTermsTable dataSource={dataSource} setDataSource={setDataSource} />
        </Modal>
    );
}
export default ImportCSVModal;
