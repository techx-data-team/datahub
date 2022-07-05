package com.linkedin.datahub.graphql.resolvers.glossary;

import com.linkedin.common.urn.CorpuserUrn;
import com.linkedin.common.urn.Urn;
// import com.linkedin.data.template.StringMap;
import com.linkedin.datahub.graphql.QueryContext;
import com.linkedin.datahub.graphql.exception.AuthorizationException;
import com.linkedin.datahub.graphql.generated.GlossaryTermLOVUpdateInput;
import com.linkedin.datahub.graphql.generated.GlossaryTermLOVInput;
// import com.linkedin.metadata.Constants;
import com.linkedin.metadata.entity.EntityService;
import graphql.schema.DataFetcher;
import graphql.schema.DataFetchingEnvironment;
import com.linkedin.glossary.GlossaryTermLOVArray;
import com.linkedin.glossary.GlossaryTermLOV;

import java.util.ArrayList;
import java.util.List;
// import java.util.HashMap;
// import java.util.Map;
import java.util.concurrent.CompletableFuture;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import static com.linkedin.datahub.graphql.resolvers.ResolverUtils.*;

@Slf4j
@RequiredArgsConstructor
public class UpdateGlossaryTermLOVResolver implements DataFetcher<CompletableFuture<Boolean>> {
    private final EntityService _entityService;

    @Override
    public CompletableFuture<Boolean> get(DataFetchingEnvironment environment) throws Exception {
        final GlossaryTermLOVUpdateInput input = bindArgument(environment.getArgument("input"),
                GlossaryTermLOVUpdateInput.class);
        Urn targetUrn = Urn.createFromString(input.getUrn());
        QueryContext context = environment.getContext();
        if (!GlossaryTermLOVUtils.isAuthorizedToUpdateCustomProperty(context, targetUrn)) {
            throw new AuthorizationException(
                    "Unauthorized to perform this action. Please contact your DataHub administrator.");
        }
        return CompletableFuture.supplyAsync(() -> {
            try {
                Urn actor = CorpuserUrn.createFromString(context.getActorUrn());
                List<GlossaryTermLOVInput> lovInputs = input.getListOfValue();
                List<GlossaryTermLOV> lovValues = new ArrayList<GlossaryTermLOV>();
                lovInputs.forEach((element) -> {
                    GlossaryTermLOV lovValue = new GlossaryTermLOV();
                    lovValue.setKey(element.getKey());
                    lovValue.setName(element.getName());
                    if (element.getDescriptions() != null) {
                        lovValue.setDescriptions(element.getDescriptions());
                    }
                    lovValues.add(lovValue);
                });
                GlossaryTermLOVArray lovArray = new GlossaryTermLOVArray(lovValues);
                log.info("Got LOV Value: {} for URN {}", lovArray.toString(), targetUrn.toString());
                GlossaryTermLOVUtils.updateGlossaryTermLOV(lovArray, targetUrn, actor, _entityService);
                return true;
            } catch (Exception e) {
                log.error("Failed to perform update against input {}, {}", input.toString(), e.getMessage());
                throw new RuntimeException(String.format("Failed to perform update against input %s", input.toString()),
                        e);
            }
        });
    }

}