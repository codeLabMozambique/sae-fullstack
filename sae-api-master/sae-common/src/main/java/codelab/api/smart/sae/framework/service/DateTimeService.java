package codelab.api.smart.sae.framework.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

/**
 * Date and Time Utility
 * 
 * @author Shifu-Taishi Grand Master (shifu-taishi@grand.master.com)
 */
@Service
public class DateTimeService {

	private static final String DD_MM_YYYY = "dd-MM-yyyy";

	public int getCurrentYear() {
		return LocalDateTime.now().getYear();
	}

	public int totalYearsUntil(LocalDate start, LocalDate end) {
		return Period.between(start, end).getYears();
	}

	public String format(LocalDate date) {
		return this.format(date, DD_MM_YYYY);
	}

	public String format(LocalDate date, String pattern) {
		return date.format(DateTimeFormatter.ofPattern(pattern));
	}

	public LocalDate extractJsDate(LocalDate date) {
		return date == null ? LocalDate.now() : date.plusDays(1);
	}

	public LocalDate extractJsCurrentDateFromMonth(int month) {
		return LocalDate.of(getCurrentYear(), month + 1, LocalDate.now().getDayOfMonth());
	}

	public LocalDateTime getStartDateFromNow(long months) {
		return LocalDateTime.now().minusMonths(months).withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
	}

	public List<String> getMonthsYearFromNow(long months) {

		List<String> monthsYear = new ArrayList<String>();
		LocalDateTime startDate = getStartDateFromNow(months);

		for (int i = 0; i <= months; i++) {
			LocalDateTime plusMonths = startDate.plusMonths(i);
			String monthYear = plusMonths.getMonthValue() + "/" + plusMonths.getYear();
			monthsYear.add(monthYear);
		}

		return monthsYear;
	}
}
