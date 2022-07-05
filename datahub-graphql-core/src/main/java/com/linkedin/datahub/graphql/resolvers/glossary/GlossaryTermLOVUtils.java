package com.linkedin.datahub.graphql.resolvers.glossary;

import com.google.common.collect.ImmutableList;

import com.linkedin.common.urn.Urn;
// import com.linkedin.container.EditableContainerProperties;
import com.linkedin.datahub.graphql.QueryContext;
import com.linkedin.datahub.graphql.authorization.AuthorizationUtils;
import com.linkedin.datahub.graphql.authorization.ConjunctivePrivilegeGroup;
import com.linkedin.datahub.graphql.authorization.DisjunctivePrivilegeGroup;

import com.linkedin.glossary.GlossaryTermInfo;
import com.linkedin.glossary.GlossaryTermLOVArray;
// import com.linkedin.identity.CorpGroupEditableInfo;
import com.linkedin.metadata.Constants;
import com.linkedin.metadata.authorization.PoliciesConfig;
import com.linkedin.metadata.entity.EntityService;
import javax.annotation.Nonnull;
import lombok.extern.slf4j.Slf4j;

import static com.linkedin.datahub.graphql.resolvers.mutate.MutationUtils.*;

@Slf4j
public class GlossaryTermLOVUtils {
    private static final ConjunctivePrivilegeGroup ALL_PRIVILEGES_GROUP = new ConjunctivePrivilegeGroup(ImmutableList.of(
        PoliciesConfig.EDIT_ENTITY_PRIVILEGE.getType()
    ));

    private GlossaryTermLOVUtils() { }


    public static void updateGlossaryTermLOV(
        @Nonnull GlossaryTermLOVArray newLOV,
        Urn resourceUrn,
        Urn actor,
        EntityService entityService
    ) {
        GlossaryTermInfo glossaryTermInfo = (GlossaryTermInfo) getAspectFromEntity(
            resourceUrn.toString(), Constants.GLOSSARY_TERM_INFO_ASPECT_NAME, entityService, null);
        if (glossaryTermInfo == null) {
            // If there are no properties for the term already, then we should throw since the properties model also requires a name.
            throw new IllegalArgumentException("Properties for this Glossary Term do not yet exist!");
        }
        log.info("Before {}", glossaryTermInfo.toString());
        glossaryTermInfo.setListOfValue(newLOV);
        log.info("After {}", glossaryTermInfo.toString());
        persistAspect(resourceUrn, Constants.GLOSSARY_TERM_INFO_ASPECT_NAME, glossaryTermInfo, actor, entityService);
    }

    public static boolean isAuthorizedToUpdateCustomProperty(@Nonnull QueryContext context, Urn targetUrn) {
        final DisjunctivePrivilegeGroup orPrivilegeGroups = new DisjunctivePrivilegeGroup(ImmutableList.of(
            ALL_PRIVILEGES_GROUP,
            new ConjunctivePrivilegeGroup(ImmutableList.of(PoliciesConfig.EDIT_ENTITY_DOCS_PRIVILEGE.getType()))
        ));
    
        return AuthorizationUtils.isAuthorized(
            context.getAuthorizer(),
            context.getActorUrn(),
            targetUrn.getEntityType(),
            targetUrn.toString(),
            orPrivilegeGroups);
      }
}
