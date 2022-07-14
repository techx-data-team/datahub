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
    // const entityRegistry = useEntityRegistry();
    const [createGlossaryTermMutation] = useCreateGlossaryTermMutation();
    const [createGlossaryNodeMutation] = useCreateGlossaryNodeMutation();

    function getUUID(value: string) {
        const md5Hash = MD5(value).toString();
        const uuid = md5ToUuid(md5Hash);
        return String(uuid);
    }

    const { data } = useGetSearchResultsForMultipleQuery({
        variables: {
            input: {
                types: [EntityType.GlossaryTerm, EntityType.GlossaryNode],
                query: '',
                start: 0,
                count: 5000,
            },
        },
        skip: !(dataSource.length === 0),
    });

    if (searchResults.length === 0) {
        const temp = data?.searchAcrossEntities?.searchResults;
        if (typeof temp === 'object') setSearchResults(temp);
    }

    function createGlossaryEntity(entityType: EntityType, inputValue: any) {
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
                    content: 'Updating...',
                    duration: 2,
                });
                setTimeout(() => {
                    message.success({
                        content: `Created ${inputValue.name}!`,
                        duration: 2,
                    });
                }, 2000);
            });
    }

    function importGlossaryEntity() {
        const dict = {
            GLOSSARY_TERM: {},
            GLOSSARY_NODE: {},
        };
        const glossaryInsert = {
            GLOSSARY_TERM: {},
            GLOSSARY_NODE: {},
        };
        setimportButtonDisabled(true);
        message.loading({ content: 'Saving new glossarys and terms...' });
        console.log('searchResults: ', searchResults);
        console.log('datasource: ', dataSource);

        searchResults.forEach((e) => {
            if (e.entity.type === 'GLOSSARY_TERM') {
                dict.GLOSSARY_TERM[e.entity.urn] = e.entity.properties.name;
            } else if (e.entity.type === 'GLOSSARY_NODE') {
                dict.GLOSSARY_NODE[e.entity.urn] = e.entity.properties.name;
            }
        });
        console.log('dict: ', dict);
        dataSource.forEach((e) => {
            console.log('e: ', e);
            if (e.term_gourp_1 && e.term_gourp_2 && e.term_gourp_3 && e.term) {
                const termGourp1Id = getUUID(e.term_gourp_1);
                const termGourp2Id = getUUID(e.term_gourp_1 + e.term_gourp_2);
                const termGourp3Id = getUUID(e.term_gourp_1 + e.term_gourp_2 + e.term_gourp_3);
                const termId = getUUID(e.term_gourp_1 + e.term_gourp_2 + e.term_gourp_3 + e.term);
                if (!(`urn:li:glossaryNode:${termGourp1Id}` in dict.GLOSSARY_NODE)) {
                    console.log(`urn:li:glossaryNode:${termGourp1Id}`);
                    glossaryInsert.GLOSSARY_NODE[termGourp1Id] = {
                        id: termGourp1Id,
                        name: e.term_gourp_1,
                        parentNode: null,
                    };
                } else {
                    console.log(`errror: urn:li:glossaryNode:${termGourp1Id}`);
                    message.info(`${e.term_gourp_1} exists in glossary terms!`);
                }
                if (!(`urn:li:glossaryNode:${termGourp2Id}` in dict.GLOSSARY_NODE)) {
                    glossaryInsert.GLOSSARY_NODE[termGourp2Id] = {
                        id: termGourp2Id,
                        name: e.term_gourp_2,
                        parentNode: `urn:li:glossaryNode:${termGourp1Id}`,
                    };
                } else {
                    message.info(`${e.term_gourp_2} exists in glossary terms!`);
                }
                if (!(`urn:li:glossaryNode:${termGourp3Id}` in dict.GLOSSARY_NODE)) {
                    glossaryInsert.GLOSSARY_NODE[termGourp3Id] = {
                        id: termGourp3Id,
                        name: e.term_gourp_3,
                        parentNode: `urn:li:glossaryNode:${termGourp2Id}`,
                    };
                } else {
                    message.info(`${e.term_gourp_3} exists in glossary terms!`);
                }
                if (!(`urn:li:glossaryTerm:${termId}` in dict.GLOSSARY_TERM)) {
                    console.log(`urn:li:glossaryTerm:${termId}`);
                    glossaryInsert.GLOSSARY_TERM[termId] = {
                        id: termId,
                        name: e.term,
                        parentNode: `urn:li:glossaryNode:${termGourp3Id}`,
                    };
                } else {
                    console.log(`error: urn:li:glossaryTerm:${termId}`);
                    message.info(`${e.term} exists in glossary terms!`);
                }
            }
        });
        // for (const key in glossaryInsert.GLOSSARY_NODE.keys()) {
        //     const value = glossaryInsert.GLOSSARY_NODE[key];
        //     createGlossaryEntity(EntityType.GlossaryNode, value);
        // }
        Object.values(glossaryInsert.GLOSSARY_NODE).forEach((value) =>
            createGlossaryEntity(EntityType.GlossaryNode, value),
        );
        // for (const key in glossaryInsert.GLOSSARY_TERM.keys()) {
        //     const value = glossaryInsert.GLOSSARY_TERM[key];
        //     createGlossaryEntity(EntityType.GlossaryTerm, value);
        // }
        Object.values(glossaryInsert.GLOSSARY_TERM).forEach((value) =>
            createGlossaryEntity(EntityType.GlossaryTerm, value),
        );
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
