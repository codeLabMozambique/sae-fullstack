package codelab.api.smart.sae.framework.seed;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import codelab.api.smart.sae.appTransaction.model.TransactionEntity;
import codelab.api.smart.sae.appTransaction.repository.TransactionRepository;
import codelab.api.smart.sae.roleTransaction.model.RoleTransactionEntity;
import codelab.api.smart.sae.roleTransaction.repository.RoleTransactionRepository;
import codelab.api.smart.sae.user.enums.MenuType;
import codelab.api.smart.sae.user.enums.UserRoles;

/**
 * Seeds the role_transaction table with one HEADER entry per UserRoles value.
 * Required because UserService.createStudent / createProfessor / createUser
 * fail-fast when no role row exists for that UserRoles + HEADER.
 *
 * Idempotent: skips any role that already has a HEADER row.
 */
@Component
public class RoleSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(RoleSeeder.class);

    private final RoleTransactionRepository roleTransactionRepository;
    private final TransactionRepository transactionRepository;

    public RoleSeeder(RoleTransactionRepository roleTransactionRepository,
                      TransactionRepository transactionRepository) {
        this.roleTransactionRepository = roleTransactionRepository;
        this.transactionRepository = transactionRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        for (UserRoles role : UserRoles.values()) {
            boolean exists = !roleTransactionRepository
                    .findByRoleAndAppTransactionTypeOrderByAppTransactionCode(role, MenuType.HEADER)
                    .isEmpty();
            if (exists) continue;

            TransactionEntity tx = new TransactionEntity();
            tx.setCode("HOME_" + role.name());
            tx.setLabel("Início");
            tx.setRouterLink("/app/dashboard");
            tx.setType(MenuType.HEADER);
            tx.setPosition(0L);
            transactionRepository.save(tx);

            RoleTransactionEntity rt = new RoleTransactionEntity();
            rt.setRole(role);
            rt.setAppTransaction(tx);
            roleTransactionRepository.save(rt);

            log.info("Seeded role HEADER row for {}", role);
        }
    }
}
